import { pathToFileURL } from 'node:url';
import { createDb, disconnectDb, type RootDb } from '../lib/db/client';
import { countryFilter } from '../lib/db/repositories/country-filter';
import { focusFilter } from '../lib/db/repositories/focus-filter';
import { LOCALES, type Locale } from '../lib/i18n/messages';
import {
  REMOTE_POLICY_REMOTE,
  type JobCountrySlug,
  type JobFocusSlug,
} from '../lib/jobs/constants';
import {
  DIGEST_JOB_LIMIT,
  DIGEST_LOOKBACK_MS,
  RESEND_MIN_INTERVAL_MS,
} from '../lib/newsletter/constants';
import {
  DIGEST_JOBS_HTML_PROPERTY,
  DIGEST_JOBS_TEXT_PROPERTY,
  DIGEST_LANE_URL_PROPERTY,
} from '../lib/newsletter/digest-email/constants';
import {
  digestLaneUrl,
  renderDigestBroadcast,
  renderDigestJobs,
} from '../lib/newsletter/digest-email/digest-email';
import { ensureDigestContactProperties } from '../lib/newsletter/digest-properties';
import { pacedResendRequest } from '../lib/newsletter/paced-request';
import { resendConfig } from '../lib/newsletter/resend';
import {
  configuredSegmentIds,
  digestLocale,
  segmentIdForLocale,
} from '../lib/newsletter/segment-for-locale/segment-for-locale';
import { siteOrigin } from '../lib/seo/site-origin/site-origin';

type Contact = { email: string; unsubscribed: boolean };
type SegmentContact = Contact & { segments: string[] };
type ListedSegment = { segmentId: string; contacts: Contact[] };
type JobSummary = { id: string; title: string; company: { name: string } };
type Subscriber = {
  email: string;
  focus: string | null;
  country: string | null;
  locale: string;
};
type PlannedRecipient = Subscriber & { locale: Locale; jobs: JobSummary[] };

const loadListedSegments = async (paceMs: number) =>
  configuredSegmentIds().reduce(
    async (previous, segmentId) => {
      const soFar = await previous;
      const page = await pacedResendRequest<{ data: Contact[] }>(
        paceMs,
        `/segments/${segmentId}/contacts`,
      );
      return [...soFar, { segmentId, contacts: page.data }];
    },
    Promise.resolve([] as ListedSegment[]),
  );

const mergeContacts = (listed: ListedSegment[]) => {
  const byEmail = listed
    .flatMap(({ segmentId, contacts }) =>
      contacts.map((contact) => ({ segmentId, contact })),
    )
    .reduce((map, { segmentId, contact }) => {
      const previous = map.get(contact.email);
      map.set(contact.email, {
        email: contact.email,
        unsubscribed: (previous?.unsubscribed ?? false) || contact.unsubscribed,
        segments: [...(previous?.segments ?? []), segmentId],
      });
      return map;
    }, new Map<string, SegmentContact>());
  return [...byEmail.values()];
};

const confirmedSubscribers = async (db: RootDb, contacts: SegmentContact[]) => {
  const active = contacts.filter((contact) => !contact.unsubscribed);
  if (active.length === 0) {
    return [];
  }
  const subscribers = await db.newsletterSubscription.findMany({
    where: {
      email: { in: active.map(({ email }) => email) },
      confirmedAt: { not: null },
    },
  });
  // These segments must be exclusive to this feature: no unverified contact
  // gets a broadcast.
  if (subscribers.length !== active.length) {
    throw new Error(
      'Newsletter segment has a contact without a confirmed subscription',
    );
  }
  return subscribers;
};

const loadJobs = (
  db: RootDb,
  focus: string,
  country: string | null,
  since: Date,
) =>
  db.job.findMany({
    where: {
      isActive: true,
      remotePolicy: REMOTE_POLICY_REMOTE,
      firstSeenAt: { gt: since },
      AND: [
        focusFilter(focus as JobFocusSlug),
        countryFilter((country ?? undefined) as JobCountrySlug | undefined),
      ],
    },
    select: {
      id: true,
      title: true,
      company: { select: { name: true } },
    },
    orderBy: { firstSeenAt: 'desc' },
    take: DIGEST_JOB_LIMIT,
  });

const jobsForScope = (
  db: RootDb,
  cache: Map<string, Promise<JobSummary[]>>,
  subscriber: Pick<Subscriber, 'focus' | 'country'>,
  since: Date,
) => {
  if (!subscriber.focus) {
    return Promise.resolve([]);
  }
  const scope = `${subscriber.focus}:${subscriber.country ?? ''}`;
  const cached = cache.get(scope);
  if (cached) {
    return cached;
  }
  const query = loadJobs(db, subscriber.focus, subscriber.country, since);
  cache.set(scope, query);
  return query;
};

const planRecipients = async (
  db: RootDb,
  subscribers: Subscriber[],
  since: Date,
) => {
  const jobsByScope = new Map<string, Promise<JobSummary[]>>();
  return Promise.all(
    subscribers.map(async (subscriber) => {
      const jobs = await jobsForScope(db, jobsByScope, subscriber, since);
      return { ...subscriber, locale: digestLocale(subscriber.locale), jobs };
    }),
  );
};

const sendingLocales = (planned: PlannedRecipient[]) =>
  LOCALES.filter((locale) =>
    planned.some(
      (recipient) => recipient.locale === locale && recipient.jobs.length > 0,
    ),
  );

const syncSubscriberSegments = async (
  subscribers: Subscriber[],
  contacts: SegmentContact[],
  paceMs: number,
) => {
  const byEmail = new Map(contacts.map((contact) => [contact.email, contact]));
  for (const subscriber of subscribers) {
    const target = segmentIdForLocale(digestLocale(subscriber.locale));
    const current = byEmail.get(subscriber.email)?.segments ?? [];
    if (!current.includes(target)) {
      await pacedResendRequest(
        paceMs,
        `/contacts/${encodeURIComponent(subscriber.email)}/segments/${target}`,
        { method: 'POST' },
      );
    }
    const stale = current.filter((segmentId) => segmentId !== target);
    for (const segmentId of stale) {
      await pacedResendRequest(
        paceMs,
        `/contacts/${encodeURIComponent(subscriber.email)}/segments/${segmentId}`,
        { method: 'DELETE' },
      );
    }
  }
};

const saveContactDigests = async (
  planned: PlannedRecipient[],
  locales: Locale[],
  origin: URL,
  paceMs: number,
) => {
  const recipients = planned.filter((recipient) =>
    locales.includes(recipient.locale),
  );
  for (const recipient of recipients) {
    const jobs = renderDigestJobs({
      locale: recipient.locale,
      origin,
      jobs: recipient.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.company.name,
      })),
    });
    await pacedResendRequest(
      paceMs,
      `/contacts/${encodeURIComponent(recipient.email)}`,
      {
        method: 'PATCH',
        body: {
          properties: {
            [DIGEST_JOBS_TEXT_PROPERTY]: jobs.text,
            [DIGEST_JOBS_HTML_PROPERTY]: jobs.html,
            [DIGEST_LANE_URL_PROPERTY]: digestLaneUrl({
              locale: recipient.locale,
              origin,
              focus: recipient.focus,
              country: recipient.country,
            }),
          },
        },
      },
    );
  }
};

const createBroadcasts = (
  locales: Locale[],
  origin: URL,
  from: string,
  sentAt: Date,
  paceMs: number,
) =>
  locales.reduce(
    async (previous, locale) => {
      const ids = await previous;
      const message = renderDigestBroadcast({ locale, origin, sentAt });
      const draft = await pacedResendRequest<{ id: string }>(
        paceMs,
        '/broadcasts',
        {
          method: 'POST',
          body: {
            name: `Daily digest ${sentAt.toISOString().slice(0, 10)} ${locale}`,
            segment_id: segmentIdForLocale(locale),
            from,
            subject: message.subject,
            html: message.html,
            text: message.text,
          },
        },
      );
      return [...ids, draft.id];
    },
    Promise.resolve([] as string[]),
  );

const sendBroadcasts = (ids: string[], paceMs: number) =>
  ids.reduce(async (previous, id) => {
    await previous;
    await pacedResendRequest(paceMs, `/broadcasts/${id}/send`, {
      method: 'POST',
      body: {},
    });
  }, Promise.resolve());

/**
 * One broadcast per language. A single Resend broadcast shares its subject
 * and shell, so each locale has its own segment. Job rows stay on the contact
 * because every lane is different. Locale is newsletter_subscriptions.locale,
 * captured at signup, and anything unknown is English.
 */
export const sendNewsletter = async (
  db: RootDb,
  now = new Date(),
  paceMs = RESEND_MIN_INTERVAL_MS,
) => {
  const date = now.toISOString().slice(0, 10);
  if (await db.newsletterDispatch.findUnique({ where: { date } })) {
    return 0;
  }
  const { from } = resendConfig();
  const origin = siteOrigin();
  const contacts = mergeContacts(await loadListedSegments(paceMs));
  const subscribers = await confirmedSubscribers(db, contacts);
  if (subscribers.length === 0) {
    return 0;
  }
  const previous = await db.newsletterDispatch.findFirst({
    where: { sentAt: { not: null } },
    orderBy: { sentAt: 'desc' },
  });
  const since =
    previous?.sentAt ?? new Date(now.getTime() - DIGEST_LOOKBACK_MS);
  const planned = await planRecipients(db, subscribers, since);
  const locales = sendingLocales(planned);
  if (locales.length === 0) {
    return 0;
  }
  subscribers.forEach((subscriber) => {
    segmentIdForLocale(digestLocale(subscriber.locale));
  });
  await syncSubscriberSegments(subscribers, contacts, paceMs);
  await ensureDigestContactProperties(paceMs);
  await saveContactDigests(planned, locales, origin, paceMs);
  const broadcastIds = await createBroadcasts(
    locales,
    origin,
    from,
    now,
    paceMs,
  );
  // Record the drafts before sending. On an uncertain send failure, do not
  // automatically retry and risk duplicate emails; inspect them in Resend.
  await db.newsletterDispatch.create({
    data: { date, broadcastId: broadcastIds.join(',') },
  });
  await sendBroadcasts(broadcastIds, paceMs);
  await db.newsletterDispatch.update({
    where: { date },
    data: { sentAt: new Date() },
  });
  return planned.filter((recipient) => locales.includes(recipient.locale))
    .length;
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const db = createDb();
  sendNewsletter(db)
    .then((count) => console.log(`Newsletter: ${count} contacts`))
    .catch((error) => {
      console.error(
        'Newsletter failed:',
        error instanceof Error ? error.message : 'Error',
      );
      process.exitCode = 1;
    })
    .finally(() => disconnectDb(db));
}
