import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const SCRIPT = join(process.cwd(), 'scripts/supabase-url.sh');
const TEST_PASSWORD = ['s3cr', ' et', ':@/%#?'].join('');
const ENCODED_TEST_PASSWORD = 's3cr%20et%3A%40%2F%25%23%3F';
const temporaryDirectories = new Set<string>();

const EXPECTED_URL =
  `postgresql://radar_reader.fjhpbdrcoutxjunqvddf:${ENCODED_TEST_PASSWORD}` +
  '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=verify-full';

type ScriptResult = {
  captureDirectory: string;
  output: string;
};

const runScript = async (
  password: string,
  confirmation: string,
  roleStatus = 'safe',
): Promise<ScriptResult> => {
  const directory = await mkdtemp(join(tmpdir(), 'supabase-url-test-'));
  temporaryDirectories.add(directory);
  const captureDirectory = join(directory, 'capture');
  const dockerPath = join(directory, 'docker');

  await mkdir(captureDirectory);
  await writeFile(
    dockerPath,
    `#!/usr/bin/env bash
set -euo pipefail
count_file="$CAPTURE_DIRECTORY/count"
count=0
if [[ -f "$count_file" ]]; then
  count=$(<"$count_file")
fi
count=$((count + 1))
printf '%s' "$count" >"$count_file"
printf '%s\\n' "$@" >"$CAPTURE_DIRECTORY/argv-$count"
printf 'PASSWORD=%s\\nPGPASSWORD=%s\\n' "\${PASSWORD-}" "\${PGPASSWORD-}" >"$CAPTURE_DIRECTORY/env-$count"
IFS= read -r password
printf '%s' "$password" >"$CAPTURE_DIRECTORY/stdin-$count"
printf '%s\\n' "\${FAKE_ROLE_STATUS:-safe}"
`,
  );
  await chmod(dockerPath, 0o700);

  const child = spawn('bash', [SCRIPT], {
    env: {
      ...process.env,
      CAPTURE_DIRECTORY: captureDirectory,
      FAKE_ROLE_STATUS: roleStatus,
      DB_ROLE: 'radar_reader',
      POOLER_PORT: '6543',
      PATH: `${directory}:${process.env.PATH ?? ''}`,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk;
  });
  child.stdin.end(`${password}\n${confirmation}\n`);

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    await rm(directory, { recursive: true, force: true });
    temporaryDirectories.delete(directory);
    throw new Error(`script exited with ${exitCode}: ${stderr}`);
  }

  return { captureDirectory, output: `${stdout}${stderr}` };
};

describe('supabase-url.sh', () => {
  afterEach(async () => {
    await Promise.all(
      [...temporaryDirectories].map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
    temporaryDirectories.clear();
  });

  it('passes the password only through stdin and hides URLs by default', async () => {
    const result = await runScript(TEST_PASSWORD, 'n');

    const [argv, environment, stdin] = await Promise.all([
      readFile(join(result.captureDirectory, 'argv-1'), 'utf8'),
      readFile(join(result.captureDirectory, 'env-1'), 'utf8'),
      readFile(join(result.captureDirectory, 'stdin-1'), 'utf8'),
    ]);

    expect(argv).not.toContain(TEST_PASSWORD);
    expect(argv).not.toContain(ENCODED_TEST_PASSWORD);
    expect(argv).toContain('PGSSLMODE=verify-full');
    expect(argv).toContain('--username=radar_reader.fjhpbdrcoutxjunqvddf');
    expect(argv).toContain("'TRUNCATE'");
    expect(argv).toContain("'MAINTAIN'");
    expect(environment).not.toContain(TEST_PASSWORD);
    expect(environment).not.toContain(ENCODED_TEST_PASSWORD);
    expect(stdin).toBe(TEST_PASSWORD);
    expect(result.output).toContain(':6543 transaction (radar_reader) - OK');

    expect(result.output).not.toContain(TEST_PASSWORD);
    expect(result.output).not.toContain(ENCODED_TEST_PASSWORD);
    expect(result.output).toContain('Connection URLs were not printed.');
  });

  it('prints encoded URLs only after explicit confirmation', async () => {
    const result = await runScript(TEST_PASSWORD, 'yes');

    expect(result.output).toContain(EXPECTED_URL);
  });

  it('rejects owner credentials before reading a password', async () => {
    const child = spawn('bash', [SCRIPT], {
      env: { ...process.env, DB_ROLE: 'postgres' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk;
    });
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain('must not be a database owner');
  });

  it('does not print a URL when the role fails the privilege check', async () => {
    await expect(runScript(TEST_PASSWORD, 'yes', 'unsafe')).rejects.toThrow(
      /failed the read least-privilege check/,
    );
  });
});
