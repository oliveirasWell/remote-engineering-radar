const decodeBasicEntities = (value: string): string =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"');

export const stripHtml = (value: string): string =>
  decodeBasicEntities(value)
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
