export const DIGEST_FIELD_MAX_LENGTH = 120;

export const DIGEST_WIDTH_PX = 600;

export const RESEND_UNSUBSCRIBE_PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}';

export const DIGEST_JOBS_TEXT_PROPERTY = 'daily_jobs';

export const DIGEST_JOBS_HTML_PROPERTY = 'daily_jobs_html';

export const DIGEST_LANE_URL_PROPERTY = 'digest_lane_url';

export const DIGEST_CONTACT_PROPERTY_KEYS = [
  DIGEST_JOBS_TEXT_PROPERTY,
  DIGEST_JOBS_HTML_PROPERTY,
  DIGEST_LANE_URL_PROPERTY,
] as const;

export const contactPropertyPlaceholder = (key: string) => `{{{${key}}}}`;

export const DIGEST_FONT_FAMILY =
  "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Hex stand-ins for the site's neutral oklch tokens. Email clients do not
 * reliably render oklch, and the grayscale still reads after Gmail inverts it.
 */
export const DIGEST_COLOR = {
  background: '#fafafa',
  backgroundDark: '#1a1a1a',
  foreground: '#2b2b2b',
  foregroundDark: '#e8e8e8',
  card: '#ffffff',
  cardDark: '#222222',
  muted: '#737373',
  mutedDark: '#8f8f8f',
  border: '#e8e8e8',
  borderDark: '#3d3d3d',
  separator: '#c8c8c8',
} as const;
