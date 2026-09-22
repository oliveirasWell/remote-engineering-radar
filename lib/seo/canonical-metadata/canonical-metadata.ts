import type { Metadata } from 'next';

/**
 * Only normalized, substantive filters belong in canonicals. Filtered views
 * are noindex unless the caller decides otherwise.
 */
export const canonicalMetadata = (
  path: string,
  filters: Record<string, string | number | undefined> = {},
  index?: boolean,
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
    robots: { index: index ?? !search, follow: true },
  };
};
