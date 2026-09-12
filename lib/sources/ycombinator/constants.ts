export const YCOMBINATOR_SOURCE_NAME = 'ycombinator';
export const YCOMBINATOR_SITE_ORIGIN = 'https://www.ycombinator.com';
export const YCOMBINATOR_REQUEST_USER_AGENT =
  'RemoteEngineeringRadar/1.0 (+https://github.com/oliveirasWell/remote-engineering-radar)';

/** Public listing pages that embed jobPostings in an Inertia data-page payload. */
export const YCOMBINATOR_LISTING_PATHS = [
  '/jobs/role/software-engineer/remote',
  '/jobs/location/remote',
] as const;

export const YCOMBINATOR_ENGINEERING_ROLE = 'eng';
