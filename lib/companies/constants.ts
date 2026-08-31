export const COMPANY_KINDS = {
  product: 'product',
  consultancy: 'consultancy',
  staffing: 'staffing',
} as const;

export type CompanyKind = (typeof COMPANY_KINDS)[keyof typeof COMPANY_KINDS];

export const DEFAULT_COMPANY_KIND: CompanyKind = COMPANY_KINDS.product;

/** Curated slug → kind map for known consultancies and staffing firms. */
const COMPANY_KIND_BY_SLUG: Readonly<Record<string, CompanyKind>> = {
  bairesdev: COMPANY_KINDS.consultancy,
  'ci-t': COMPANY_KINDS.consultancy,
  cit: COMPANY_KINDS.consultancy,
  accenture: COMPANY_KINDS.consultancy,
  thoughtworks: COMPANY_KINDS.consultancy,
  globant: COMPANY_KINDS.consultancy,
  endava: COMPANY_KINDS.consultancy,
  epam: COMPANY_KINDS.consultancy,
  andela: COMPANY_KINDS.staffing,
  turing: COMPANY_KINDS.staffing,
  toptal: COMPANY_KINDS.staffing,
};

export const resolveCompanyKind = (slug: string): CompanyKind =>
  COMPANY_KIND_BY_SLUG[slug] ?? DEFAULT_COMPANY_KIND;
