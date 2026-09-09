import type { Metadata } from 'next';

/** Only normalized, substantive filters belong in canonicals. */
export const canonicalMetadata = (
  path: string,
  filters: Record<string, string | number | undefined> = {},
): Metadata => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const search = query.toString();
  return {
    alternates: { canonical: search ? `${path}?${search}` : path },
    robots: { index: !search, follow: true },
  };
};
