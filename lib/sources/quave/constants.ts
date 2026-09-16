export const QUAVE_SOURCE_NAME = 'quave';

export const QUAVE_ISSUES_URL =
  'https://api.github.com/repos/quavedev/join/issues';

export const QUAVE_ISSUES_PER_PAGE = 100;

export const QUAVE_MAX_PAGES = 10;

export const QUAVE_COMPANY_NAME = 'Quave';

export const QUAVE_COMPANY_WEBSITE_URL = 'https://quave.dev';

export const QUAVE_REQUEST_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'remote-engineering-radar',
  'X-GitHub-Api-Version': '2022-11-28',
} as const;
