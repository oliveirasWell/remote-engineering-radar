const decodeBasicEntities = (value: string): string =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/&#(x[0-9a-f]+|\d+);/gi, (entity, digits: string) => {
      const codePoint = digits.toLowerCase().startsWith('x')
        ? Number.parseInt(digits.slice(1), 16)
        : Number(digits);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    });

/**
 * Splitting on '>' leaves each tag at the end of its chunk, opened by the
 * chunk's first '<'. One pass and no regex, so an unclosed '<' is never
 * rescanned. `<>` and a stray '>' stay as text.
 */
const stripTrailingTag = (chunk: string): string => {
  const opening = chunk.indexOf('<');
  return opening === -1 || opening === chunk.length - 1
    ? `${chunk}>`
    : `${chunk.slice(0, opening)} `;
};

export const stripHtml = (value: string): string => {
  const chunks = decodeBasicEntities(value).split('>');
  return [...chunks.slice(0, -1).map(stripTrailingTag), chunks.at(-1)]
    .join('')
    .replaceAll(/\s+/g, ' ')
    .trim();
};
