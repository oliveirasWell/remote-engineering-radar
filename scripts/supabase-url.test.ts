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
const TEST_PASSWORD = 's3cr et:@/%#?';
const ENCODED_TEST_PASSWORD = 's3cr%20et%3A%40%2F%25%23%3F';
const CONNECTIONS = [
  { invocation: 1, port: '6543', mode: 'transaction', consumer: 'Vercel' },
  { invocation: 2, port: '5432', mode: 'session', consumer: 'Actions' },
] as const;
const temporaryDirectories = new Set<string>();

const expectedUrl = (port: string): string =>
  `postgresql://postgres.fjhpbdrcoutxjunqvddf:${ENCODED_TEST_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:${port}/postgres`;

type ScriptResult = {
  captureDirectory: string;
  output: string;
};

const runScript = async (
  password: string,
  confirmation: string,
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
env >"$CAPTURE_DIRECTORY/env-$count"
IFS= read -r password
printf '%s' "$password" >"$CAPTURE_DIRECTORY/stdin-$count"
`,
  );
  await chmod(dockerPath, 0o700);

  const child = spawn('bash', [SCRIPT], {
    env: {
      ...process.env,
      CAPTURE_DIRECTORY: captureDirectory,
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

    for (const { invocation, port, mode, consumer } of CONNECTIONS) {
      const [argv, environment, stdin] = await Promise.all([
        readFile(join(result.captureDirectory, `argv-${invocation}`), 'utf8'),
        readFile(join(result.captureDirectory, `env-${invocation}`), 'utf8'),
        readFile(join(result.captureDirectory, `stdin-${invocation}`), 'utf8'),
      ]);

      expect(argv).not.toContain(TEST_PASSWORD);
      expect(argv).not.toContain(ENCODED_TEST_PASSWORD);
      expect(environment).not.toContain(TEST_PASSWORD);
      expect(environment).not.toContain(ENCODED_TEST_PASSWORD);
      expect(stdin).toBe(TEST_PASSWORD);
      expect(result.output).toContain(`:${port} ${mode} (${consumer}) - OK`);
    }

    expect(result.output).not.toContain(TEST_PASSWORD);
    expect(result.output).not.toContain(ENCODED_TEST_PASSWORD);
    expect(result.output).toContain('Connection URLs were not printed.');
  });

  it('prints encoded URLs only after explicit confirmation', async () => {
    const result = await runScript(TEST_PASSWORD, 'yes');

    for (const { port } of CONNECTIONS) {
      expect(result.output).toContain(expectedUrl(port));
    }
  });
});
