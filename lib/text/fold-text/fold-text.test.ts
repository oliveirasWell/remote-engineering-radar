import { foldText } from './fold-text';

const ACCENTED = 'Desenvolvedor SÊNIOR em São Paulo — Júnior, Estágio';
const FOLDED = 'desenvolvedor senior em sao paulo — junior, estagio';

describe('foldText', () => {
  it('lowercases and strips diacritics without touching other characters', () => {
    expect(foldText(ACCENTED)).toBe(FOLDED);
  });
});
