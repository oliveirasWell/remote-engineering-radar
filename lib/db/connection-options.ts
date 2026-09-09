import { dirname, resolve } from 'node:path';
import { rootCertificates } from 'node:tls';
import { fileURLToPath } from 'node:url';
import { SUPABASE_ROOT_CA } from './supabase-root-ca';

const DB_CONNECT_TIMEOUT_MILLISECONDS = 10_000;
const DB_IDLE_TIMEOUT_MILLISECONDS = 20_000;
const DB_MAX_CONNECTIONS = 10;
const DB_QUERY_TIMEOUT_MILLISECONDS = 30_000;
const SSL_CONNECTION_PARAMETERS = [
  'ssl',
  'sslaccept',
  'sslcert',
  'sslkey',
  'sslmode',
  'sslnegotiation',
  'sslrootcert',
  'uselibpqcompat',
] as const;

const secureConnectionString = (connectionString: string): string => {
  const url = new URL(connectionString);
  for (const parameter of SSL_CONNECTION_PARAMETERS) {
    url.searchParams.delete(parameter);
  }
  return url.toString();
};

export const securePrismaConnectionString = (
  connectionString: string,
): string => {
  const parameters = new URL(connectionString).searchParams;
  const url = new URL(secureConnectionString(connectionString));
  const hostname = url.hostname.toLowerCase();
  // Prisma's sslcert is a trusted CA PEM path, not pg's client certificate.
  let certificate =
    parameters.get('sslcert')?.trim() || parameters.get('sslrootcert')?.trim();
  if (
    !certificate &&
    (hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.com'))
  ) {
    certificate = resolve(
      dirname(fileURLToPath(import.meta.url)),
      'supabase-root-ca.pem',
    );
  }
  if (certificate) {
    url.searchParams.set('sslcert', certificate);
  }
  url.searchParams.set(
    'sslmode',
    databaseSslMode(connectionString) === false ? 'disable' : 'require',
  );
  // The schema engine accepts invalid certificates by default, even with require.
  url.searchParams.set('sslaccept', 'strict');
  return url.toString();
};

export const databaseSslMode = (
  connectionString: string,
): false | { ca: string[]; rejectUnauthorized: true } => {
  const hostname = new URL(connectionString).hostname;
  return hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
    ? false
    : {
        ca: [...rootCertificates, SUPABASE_ROOT_CA],
        rejectUnauthorized: true,
      };
};

export const databasePoolConfig = (connectionString: string) => ({
  // pg lets URL query parameters override the explicit ssl object.
  connectionString: secureConnectionString(connectionString),
  connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MILLISECONDS,
  idleTimeoutMillis: DB_IDLE_TIMEOUT_MILLISECONDS,
  max: DB_MAX_CONNECTIONS,
  query_timeout: DB_QUERY_TIMEOUT_MILLISECONDS,
  ssl: databaseSslMode(connectionString),
});
