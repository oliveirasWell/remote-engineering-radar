export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
