/**
 * Lowercases and strips diacritics, so accent-free patterns match accented
 * text: `\b` treats "ê" as a word boundary, so /\bsenior\b/ never matches
 * "Sênior" unfolded.
 */
export const foldText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
