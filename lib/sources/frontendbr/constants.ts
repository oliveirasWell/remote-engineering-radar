export const FRONTENDBR_SOURCE_NAME = 'frontendbr';

export const FRONTENDBR_ISSUES_URL =
  'https://api.github.com/repos/frontendbr/vagas/issues';

export const FRONTENDBR_ISSUES_PER_PAGE = 100;

export const FRONTENDBR_MAX_PAGES = 20;

export const FRONTENDBR_REQUEST_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'remote-engineering-radar',
  'X-GitHub-Api-Version': '2022-11-28',
} as const;
