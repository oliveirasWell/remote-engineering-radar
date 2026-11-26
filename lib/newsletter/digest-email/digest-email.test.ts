import { LOCALES, messagesFor, type Locale } from '@/lib/i18n/messages';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import {
  contactPropertyPlaceholder,
  DIGEST_JOBS_HTML_PROPERTY,
  DIGEST_JOBS_TEXT_PROPERTY,
  DIGEST_LANE_URL_PROPERTY,
  RESEND_UNSUBSCRIBE_PLACEHOLDER,
} from './constants';
import {
  renderDigestBroadcast,
  renderSubscriberDigest,
  sanitizeDigestField,
} from './digest-email';
import {
  DIGEST_COUNTRY,
  DIGEST_FOCUS,
  DIGEST_JOBS,
  DIGEST_ORIGIN,
  DIGEST_SENT_AT,
  DIGEST_TEMPLATE_TITLE,
  DIGEST_UNSUBSCRIBE_URL,
} from './fixtures';

const origin = new URL(DIGEST_ORIGIN);
const sentAt = new Date(DIGEST_SENT_AT);
const otherLocale = (locale: Locale): Locale =>
  locale === 'pt-BR' ? 'en' : 'pt-BR';

const laneUrlFor = (locale: Locale) =>
  new URL(
    localizedPath(
      locale,
      `/jobs?focus=${DIGEST_FOCUS}&country=${DIGEST_COUNTRY}`,
    ),
    origin,
  ).toString();

const render = (locale: Locale) =>
  renderSubscriberDigest({
    locale,
    origin,
    sentAt,
    jobs: DIGEST_JOBS,
    focus: DIGEST_FOCUS,
    country: DIGEST_COUNTRY,
    unsubscribeUrl: DIGEST_UNSUBSCRIBE_URL,
  });

describe.each(LOCALES)('daily digest email in %s', (locale) => {
  const messages = messagesFor(locale);
  const other = messagesFor(otherLocale(locale)).newsletter.digest;
  const email = render(locale);
  const [first, second] = DIGEST_JOBS;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(sentAt);
  const homeUrl = new URL(localizedPath(locale, '/'), origin).toString();
  const jobUrl = new URL(
    localizedPath(locale, `/jobs/${first.id}`),
    origin,
  ).toString();

  it('uses only that language', () => {
    expect(email.subject).toBe(messages.newsletter.digest.subject);
    expect(email.subject).not.toContain(other.subject);
    expect(email.html).toContain(`<html lang="${locale}">`);
    expect(email.html).not.toContain(other.intro);
    expect(email.html).not.toContain(other.unsubscribe);
    expect(email.html).not.toContain(other.seeAll);
    expect(email.html).not.toContain(other.home);
    expect(email.text).not.toContain(other.intro);
    expect(email.text).not.toContain(other.unsubscribe);
  });

  it('keeps each job in its own block instead of one line', () => {
    const firstAt = email.html.indexOf(first.title);
    const secondAt = email.html.indexOf(second.title);
    expect(firstAt).toBeGreaterThan(-1);
    expect(email.html.slice(firstAt, secondAt)).toContain('</table>');
    expect(email.html.split('\n').length).toBeGreaterThan(8);
    expect(email.html).toContain('<h1');
    expect(email.html).toContain(`href="${jobUrl}"`);
    expect(email.html).toContain(second.companyName);
    expect(email.text.split('\n').length).toBeGreaterThan(3);
    expect(email.text).toContain(`${first.title} — ${first.companyName}`);
    expect(email.text).toContain(jobUrl);
    expect(email.text).not.toContain('<table');
  });

  it('includes the lane, the home page, the send date, and unsubscribe', () => {
    const laneUrl = laneUrlFor(locale);
    expect(email.html).toContain(messages.newsletter.digest.seeAll);
    expect(email.html).toContain(laneUrl.replaceAll('&', '&amp;'));
    expect(email.html).toContain(messages.app.name);
    expect(email.html).toContain(dateLabel);
    expect(email.html).toContain(`datetime="${DIGEST_SENT_AT.slice(0, 10)}"`);
    expect(email.html).toContain(`href="${homeUrl}"`);
    expect(email.html).toContain(messages.newsletter.digest.home);
    expect(email.html).toContain(`href="${DIGEST_UNSUBSCRIBE_URL}"`);
    expect(email.html).toContain(messages.newsletter.digest.unsubscribe);
    expect(email.text).toContain(laneUrl);
    expect(email.text).toContain(dateLabel);
    expect(email.text).toContain(homeUrl);
    expect(email.text).toContain(DIGEST_UNSUBSCRIBE_URL);
    expect(email.text).toContain(messages.newsletter.digest.unsubscribe);
  });
});

it('renders an empty lane without dropping the text alternative', () => {
  const email = renderSubscriberDigest({
    locale: 'en',
    origin,
    sentAt,
    jobs: [],
    focus: DIGEST_FOCUS,
    country: null,
    unsubscribeUrl: DIGEST_UNSUBSCRIBE_URL,
  });
  const { digest } = messagesFor('en').newsletter;
  expect(email.html).toContain(digest.empty);
  expect(email.html).toContain('</p>');
  expect(email.text).toContain(digest.empty);
  expect(email.text).toContain(DIGEST_UNSUBSCRIBE_URL);
  expect(email.html).not.toContain('country=');
});

it('keeps provider templates out of job fields', () => {
  const email = renderSubscriberDigest({
    locale: 'en',
    origin,
    sentAt,
    jobs: [
      {
        id: DIGEST_JOBS[0].id,
        title: DIGEST_TEMPLATE_TITLE,
        companyName: DIGEST_JOBS[0].companyName,
      },
    ],
    focus: DIGEST_FOCUS,
    country: DIGEST_COUNTRY,
    unsubscribeUrl: DIGEST_UNSUBSCRIBE_URL,
  });
  expect(email.html).not.toContain(DIGEST_TEMPLATE_TITLE);
  expect(email.text).not.toContain(DIGEST_TEMPLATE_TITLE);
  expect(sanitizeDigestField(DIGEST_TEMPLATE_TITLE)).not.toContain('{');
});

it.each(LOCALES)(
  'leaves job rows and unsubscribe for Resend to fill in %s',
  (locale) => {
    const broadcast = renderDigestBroadcast({ locale, origin, sentAt });
    expect(broadcast.subject).toBe(
      messagesFor(locale).newsletter.digest.subject,
    );
    expect(broadcast.html).toContain(
      contactPropertyPlaceholder(DIGEST_JOBS_HTML_PROPERTY),
    );
    expect(broadcast.html).toContain(RESEND_UNSUBSCRIBE_PLACEHOLDER);
    expect(broadcast.html).toContain('<table');
    expect(broadcast.html.split('\n').length).toBeGreaterThan(8);
    expect(broadcast.text).toContain(
      contactPropertyPlaceholder(DIGEST_JOBS_TEXT_PROPERTY),
    );
    expect(broadcast.text).toContain(
      contactPropertyPlaceholder(DIGEST_LANE_URL_PROPERTY),
    );
    expect(broadcast.text).toContain(RESEND_UNSUBSCRIBE_PLACEHOLDER);
    expect(broadcast.html).not.toContain(DIGEST_JOBS[0].title);
  },
);
