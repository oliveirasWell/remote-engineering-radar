export const routeRequest = (path: string, query = '') =>
  new Request(`http://localhost${path}${query}`);
