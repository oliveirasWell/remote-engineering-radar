import { messagesFor, type Locale } from '@/lib/i18n/messages';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import {
  contactPropertyPlaceholder,
  DIGEST_COLOR,
  DIGEST_FIELD_MAX_LENGTH,
  DIGEST_FONT_FAMILY,
  DIGEST_JOBS_HTML_PROPERTY,
  DIGEST_JOBS_TEXT_PROPERTY,
  DIGEST_LANE_URL_PROPERTY,
  DIGEST_WIDTH_PX,
  RESEND_UNSUBSCRIBE_PLACEHOLDER,
} from './constants';

export type DigestJob = {
  id: string;
  title: string;
  companyName: string;
};

type DigestEmail = {
  subject: string;
  html: string;
  text: string;
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: 'long',
  timeZone: 'UTC',
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Keeps provider template markers and control characters out of job fields. */
export const sanitizeDigestField = (value: string) =>
  value.replaceAll(/[\x00-\x1f{}]/g, ' ').slice(0, DIGEST_FIELD_MAX_LENGTH);

const formatDigestDate = (sentAt: Date, locale: Locale) =>
  new Intl.DateTimeFormat(locale, DATE_FORMAT).format(sentAt);

const digestDateStamp = (sentAt: Date) => sentAt.toISOString().slice(0, 10);

const digestHomeUrl = (locale: Locale, origin: URL) =>
  new URL(localizedPath(locale, '/'), origin).toString();

export const digestLaneUrl = ({
  locale,
  origin,
  focus,
  country,
}: {
  locale: Locale;
  origin: URL;
  focus: string | null;
  country: string | null;
}) => {
  const params = new URLSearchParams();
  if (focus) {
    params.set('focus', focus);
  }
  if (country) {
    params.set('country', country);
  }
  const query = params.toString();
  const path = query ? `/jobs?${query}` : '/jobs';
  return new URL(localizedPath(locale, path), origin).toString();
};

const digestJobUrl = (locale: Locale, origin: URL, id: string) =>
  new URL(localizedPath(locale, `/jobs/${id}`), origin).toString();

const darkModeStyle = `
:root { color-scheme: light dark; }
@media (prefers-color-scheme: dark) {
  .digest-bg { background-color: ${DIGEST_COLOR.backgroundDark} !important; }
  .digest-card { background-color: ${DIGEST_COLOR.cardDark} !important; border-color: ${DIGEST_COLOR.borderDark} !important; }
  .digest-text, .digest-link { color: ${DIGEST_COLOR.foregroundDark} !important; }
  .digest-muted { color: ${DIGEST_COLOR.mutedDark} !important; }
  .digest-rule { border-color: ${DIGEST_COLOR.borderDark} !important; }
}
`.trim();

const jobCard = (locale: Locale, origin: URL, job: DigestJob) => {
  const title = escapeHtml(sanitizeDigestField(job.title));
  const company = escapeHtml(sanitizeDigestField(job.companyName));
  const href = escapeHtml(digestJobUrl(locale, origin, job.id));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px">
  <tr>
    <td class="digest-card" style="padding:16px 18px;background:${DIGEST_COLOR.card};border:1px solid ${DIGEST_COLOR.border}">
      <a class="digest-link" href="${href}" style="color:${DIGEST_COLOR.foreground};font-size:16px;line-height:1.35;font-weight:700;text-decoration:underline">${title}</a>
      <p class="digest-muted" style="margin:6px 0 0;color:${DIGEST_COLOR.muted};font-size:14px;line-height:1.4">${company}</p>
    </td>
  </tr>
</table>`;
};

export const renderDigestJobs = ({
  locale,
  origin,
  jobs,
}: {
  locale: Locale;
  origin: URL;
  jobs: readonly DigestJob[];
}) => {
  const { digest } = messagesFor(locale).newsletter;
  if (jobs.length === 0) {
    return {
      html: `<p class="digest-muted" style="margin:0;color:${DIGEST_COLOR.muted};font-size:15px;line-height:1.5">${escapeHtml(digest.empty)}</p>`,
      text: digest.empty,
    };
  }
  return {
    html: jobs.map((job) => jobCard(locale, origin, job)).join('\n'),
    text: jobs
      .map((job) => {
        const title = sanitizeDigestField(job.title);
        const company = sanitizeDigestField(job.companyName);
        return `${title} — ${company}\n${digestJobUrl(locale, origin, job.id)}`;
      })
      .join('\n\n'),
  };
};

const renderDigestEmail = ({
  locale,
  origin,
  sentAt,
  jobsHtml,
  jobsText,
  laneUrl,
  unsubscribeUrl,
}: {
  locale: Locale;
  origin: URL;
  sentAt: Date;
  jobsHtml: string;
  jobsText: string;
  laneUrl: string;
  unsubscribeUrl: string;
}): DigestEmail => {
  const messages = messagesFor(locale);
  const { digest } = messages.newsletter;
  const homeUrl = digestHomeUrl(locale, origin);
  const dateLabel = formatDigestDate(sentAt, locale);
  const wordmark = messages.app.name
    .split(' ')
    .map((line) => escapeHtml(line))
    .join('<br>');
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(digest.subject)}</title>
<style>${darkModeStyle}</style>
</head>
<body class="digest-bg" bgcolor="${DIGEST_COLOR.background}" style="margin:0;padding:0;background:${DIGEST_COLOR.background};color:${DIGEST_COLOR.foreground};font-family:${DIGEST_FONT_FAMILY};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(digest.preview)}</div>
  <table role="presentation" class="digest-bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${DIGEST_COLOR.background}" style="background:${DIGEST_COLOR.background}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="${DIGEST_WIDTH_PX}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${DIGEST_WIDTH_PX}px">
          <tr>
            <td class="digest-rule" style="padding:0 0 20px;border-bottom:1px solid ${DIGEST_COLOR.border}">
              <a class="digest-text" href="${escapeHtml(homeUrl)}" style="color:${DIGEST_COLOR.foreground};text-decoration:none;font-weight:800;letter-spacing:-0.07em;line-height:0.9;font-size:22px">${wordmark}</a>
            </td>
          </tr>
          <tr>
            <td>
              <h1 class="digest-text" style="margin:24px 0 16px;font-size:20px;line-height:1.3;font-weight:700;color:${DIGEST_COLOR.foreground}">${escapeHtml(digest.intro)}</h1>
              ${jobsHtml}
              <p style="margin:8px 0 28px;font-size:14px;line-height:1.5">
                <a class="digest-link" href="${escapeHtml(laneUrl)}" style="color:${DIGEST_COLOR.foreground};text-decoration:underline">${escapeHtml(digest.seeAll)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td class="digest-rule" style="padding-top:20px;border-top:1px solid ${DIGEST_COLOR.border}">
              <p class="digest-muted" style="margin:0;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:-0.02em;color:${DIGEST_COLOR.muted}">${escapeHtml(messages.app.name)}</p>
              <p class="digest-muted" style="margin:4px 0 0;font-size:12px;line-height:1.4;color:${DIGEST_COLOR.muted}"><time datetime="${digestDateStamp(sentAt)}">${escapeHtml(dateLabel)}</time></p>
              <p style="margin:12px 0 0;font-size:12px;line-height:1.4">
                <a class="digest-link" href="${escapeHtml(homeUrl)}" style="color:${DIGEST_COLOR.muted};text-decoration:underline">${escapeHtml(digest.home)}</a>
                <span class="digest-muted" style="color:${DIGEST_COLOR.separator}"> · </span>
                <a class="digest-link" href="${escapeHtml(unsubscribeUrl)}" style="color:${DIGEST_COLOR.muted};text-decoration:underline">${escapeHtml(digest.unsubscribe)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = [
    digest.intro,
    '',
    jobsText,
    '',
    `${digest.seeAll}: ${laneUrl}`,
    '',
    messages.app.name,
    dateLabel,
    `${digest.home}: ${homeUrl}`,
    `${digest.unsubscribe}: ${unsubscribeUrl}`,
  ].join('\n');
  return { subject: digest.subject, html, text };
};

export const renderSubscriberDigest = ({
  locale,
  origin,
  sentAt,
  jobs,
  focus,
  country,
  unsubscribeUrl,
}: {
  locale: Locale;
  origin: URL;
  sentAt: Date;
  jobs: readonly DigestJob[];
  focus: string;
  country: string | null;
  unsubscribeUrl: string;
}): DigestEmail => {
  const rendered = renderDigestJobs({ locale, origin, jobs });
  return renderDigestEmail({
    locale,
    origin,
    sentAt,
    jobsHtml: rendered.html,
    jobsText: rendered.text,
    laneUrl: digestLaneUrl({ locale, origin, focus, country }),
    unsubscribeUrl,
  });
};

/** Broadcast shell. Job rows and the lane link are contact properties. */
export const renderDigestBroadcast = ({
  locale,
  origin,
  sentAt,
}: {
  locale: Locale;
  origin: URL;
  sentAt: Date;
}): DigestEmail =>
  renderDigestEmail({
    locale,
    origin,
    sentAt,
    jobsHtml: contactPropertyPlaceholder(DIGEST_JOBS_HTML_PROPERTY),
    jobsText: contactPropertyPlaceholder(DIGEST_JOBS_TEXT_PROPERTY),
    laneUrl: contactPropertyPlaceholder(DIGEST_LANE_URL_PROPERTY),
    unsubscribeUrl: RESEND_UNSUBSCRIBE_PLACEHOLDER,
  });
