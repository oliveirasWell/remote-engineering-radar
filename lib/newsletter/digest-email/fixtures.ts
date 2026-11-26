export const DIGEST_ORIGIN = 'https://example.com';

export const DIGEST_UNSUBSCRIBE_URL = 'https://example.com/unsubscribe/token';

export const DIGEST_SENT_AT = '2026-11-26T11:00:00.000Z';

export const DIGEST_FOCUS = 'engineering';

export const DIGEST_COUNTRY = 'brazil';

export const DIGEST_EMAIL = 'one@example.com';

export const DIGEST_EMAIL_SECOND = 'two@example.com';

export const DIGEST_TEMPLATE_TITLE = '{{{contact.email}}}';

export const DIGEST_SEGMENT_EN = 'segment-en';

export const DIGEST_SEGMENT_PT = 'segment-pt';

export const DIGEST_FROM = 'Jobs <jobs@example.com>';

export const DIGEST_JOBS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Remote React',
    companyName: 'Acme',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Staff Node',
    companyName: 'Northwind',
  },
] as const;
