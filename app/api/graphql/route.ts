import { createYoga } from 'graphql-yoga';
import { GRAPHQL_ENDPOINT } from './constants';
import { isAuthorizedRequest } from './is-authorized-request';
import { radarSchema } from './schema';

const yoga = createYoga({
  schema: radarSchema,
  graphqlEndpoint: GRAPHQL_ENDPOINT,
  graphiql: false,
  landingPage: false,
  cors: false,
  fetchAPI: { Response },
});

const UNAUTHORIZED_HEADERS = { 'WWW-Authenticate': 'Bearer' };

/** Server-to-server only: no GET, no GraphiQL, no CORS headers. */
export const POST = async (request: Request): Promise<Response> =>
  isAuthorizedRequest(request)
    ? yoga.fetch(request)
    : new Response(null, { status: 401, headers: UNAUTHORIZED_HEADERS });
