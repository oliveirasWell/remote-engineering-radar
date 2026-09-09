import {
  COMPANY_KINDS,
  DEFAULT_COMPANY_KIND,
  resolveCompanyKind,
} from './constants';

const INHERITED_SLUGS = [
  'constructor',
  '__proto__',
  'toString',
  'valueOf',
  'hasOwnProperty',
] as const;
const COMPANY_KIND_CASES = [
  { slug: 'bairesdev', expected: COMPANY_KINDS.consultancy },
  { slug: 'ci-t', expected: COMPANY_KINDS.consultancy },
  { slug: 'andela', expected: COMPANY_KINDS.staffing },
  { slug: 'unknown-company', expected: DEFAULT_COMPANY_KIND },
] as const;

describe('resolveCompanyKind', () => {
  it.each(INHERITED_SLUGS)('defaults inherited slug %s to product', (slug) => {
    expect(resolveCompanyKind(slug)).toBe(DEFAULT_COMPANY_KIND);
  });

  it.each(COMPANY_KIND_CASES)(
    'resolves $slug to $expected',
    ({ slug, expected }) => {
      expect(resolveCompanyKind(slug)).toBe(expected);
    },
  );
});
