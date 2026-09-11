const decodeBasicEntities = (value: string): string =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (entity, digits: string) => {
      const codePoint = digits.toLowerCase().startsWith('x')
        ? Number.parseInt(digits.slice(1), 16)
        : Number(digits);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    });

export const stripHtml = (value: string): string => {
  const decoded = decodeBasicEntities(value);
  const parts: string[] = [];
  let textStart = 0;
  let opening = decoded.indexOf('<');

  // Never rescan an unclosed suffix for each nested '<'.
  while (opening !== -1) {
    const closing = decoded.indexOf('>', opening + 1);
    if (closing === -1) {
      break;
    }
    if (closing > opening + 1) {
      parts.push(decoded.slice(textStart, opening), ' ');
      textStart = closing + 1;
    }
    opening = decoded.indexOf('<', closing + 1);
  }

  parts.push(decoded.slice(textStart));
  return parts.join('').replaceAll(/\s+/g, ' ').trim();
};
