const DB_CONNECT_TIMEOUT_MILLISECONDS = 10_000;
const DB_IDLE_TIMEOUT_MILLISECONDS = 20_000;
const DB_MAX_CONNECTIONS = 10;
const DB_QUERY_TIMEOUT_MILLISECONDS = 30_000;
const SSL_CONNECTION_PARAMETERS = [
  'ssl',
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
  const url = new URL(secureConnectionString(connectionString));
  url.searchParams.set(
    'sslmode',
    databaseSslMode(connectionString) === false ? 'disable' : 'require',
  );
  return url.toString();
};

export const databaseSslMode = (
  connectionString: string,
): false | { rejectUnauthorized: true } => {
  const hostname = new URL(connectionString).hostname;
  return hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
    ? false
    : { rejectUnauthorized: true };
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
