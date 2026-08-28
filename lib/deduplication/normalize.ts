export const normalizeCompanyName = (name: string): string =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim()
    .replaceAll(/\s+/g, ' ');

export const normalizeJobTitle = (title: string): string =>
  title
    .toLowerCase()
    .replaceAll(/[^a-z0-9+#.]+/g, ' ')
    .trim()
    .replaceAll(/\s+/g, ' ');

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    if (
      (parsed.protocol === 'https:' && parsed.port === '443') ||
      (parsed.protocol === 'http:' && parsed.port === '80')
    ) {
      parsed.port = '';
    }
    const pathname =
      parsed.pathname.endsWith('/') && parsed.pathname.length > 1
        ? parsed.pathname.slice(0, -1)
        : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
};
