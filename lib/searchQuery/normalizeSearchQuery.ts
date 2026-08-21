export const normalizeSearchQuery = (query: string) =>
  query.trim().replace(/\s+/g, ' ').toLowerCase();
