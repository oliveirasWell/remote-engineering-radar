import { pathToFileURL } from 'node:url';
import { createDb, disconnectDb, type RootDb } from '../lib/db/client';
import { countryFilter } from '../lib/db/repositories/country-filter';
import { focusFilter } from '../lib/db/repositories/focus-filter';
import {
  REMOTE_POLICY_REMOTE,
  type JobCountrySlug,
  type JobFocusSlug,
} from '../lib/jobs/constants';
import { resendConfig, resendRequest } from '../lib/newsletter/resend';
import { siteOrigin } from '../lib/seo/site-origin/site-origin';

type Contact = { email: string; unsubscribed: boolean };
type JobSummary = { id: string; title: string; company: { name: string } };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const digestText = (
  jobs: JobSummary[],
  locale: string,
  origin: URL,
): string => {
  if (jobs.length === 0) {
    return locale === 'pt-BR' ? 'Sem vagas novas hoje.' : 'No new jobs today.';
  }
  const clean = (value: string) =>
    value.replaceAll(/[\x00-\x1f{}]/g, ' ').slice(0, 120);
  return jobs
    .map(
      (job) =>
        `${clean(job.title)} — ${clean(job.company.name)}\n${new URL(`/jobs/${job.id}`, origin)}`,
    )
    .join('\n\n');
};

export const sendNewsletter = async (db: RootDb, now = new Date()) => {
  const { from, segmentId } = resendConfig();
  const origin = siteOrigin();
  const date = now.toISOString().slice(0, 10);
  if (await db.newsletterDispatch.findUnique({ where: { date } })) {
    return 0;
  }

  const { data: contacts } = await resendRequest<{ data: Contact[] }>(
    `/segments/${segmentId}/contacts`,
  );
  const active = contacts.filter((contact) => !contact.unsubscribed);
  if (active.length === 0) {
    return 0;
  }
  const subscribers = await db.newsletterSubscription.findMany({
    where: {
      email: { in: active.map(({ email }) => email) },
      confirmedAt: { not: null },
    },
  });
  // This segment must be exclusive to this feature: no unverified contact gets a broadcast.
  if (subscribers.length !== active.length) {
    throw new Error(
      'Newsletter segment has a contact without a confirmed subscription',
    );
  }
  const previous = await db.newsletterDispatch.findFirst({
    where: { sentAt: { not: null } },
    orderBy: { sentAt: 'desc' },
  });
  const since = previous?.sentAt ?? new Date(now.getTime() - 86_400_000);
  const jobsByScope = new Map<string, Promise<JobSummary[]>>();
  const results = await Promise.all(
    subscribers.map(async ({ email, focus, country, locale }) => {
      const scope = `${focus}:${country ?? ''}`;
      if (!jobsByScope.has(scope)) {
        jobsByScope.set(
          scope,
          db.job.findMany({
            where: {
              isActive: true,
              remotePolicy: REMOTE_POLICY_REMOTE,
              firstSeenAt: { gt: since },
              AND: [
                focusFilter(focus as JobFocusSlug),
                countryFilter(
                  (country ?? undefined) as JobCountrySlug | undefined,
                ),
              ],
            },
            select: {
              id: true,
              title: true,
              company: { select: { name: true } },
            },
            orderBy: { firstSeenAt: 'desc' },
            take: 8,
          }),
        );
      }
      const jobs = await jobsByScope.get(scope)!;
      return { email, jobs, text: digestText(jobs, locale, origin) };
    }),
  );
  if (results.every(({ jobs }) => jobs.length === 0)) {
    return 0;
  }

  for (const { email, text } of results) {
    await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: { properties: { daily_jobs: text } },
    });
    // Resend's default API limit is 2 requests/second on the Free plan.
    await sleep(600);
  }
  const broadcast = await resendRequest<{ id: string }>('/broadcasts', {
    method: 'POST',
    body: {
      segment_id: segmentId,
      from,
      subject: 'Vagas remotas de hoje / Today’s remote jobs',
      text: 'Vagas da sua lane / Jobs for your saved lane:\n\n{{{contact.daily_jobs}}}\n\nDescadastrar / Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}',
    },
  });
  // Record the draft before sending. On an uncertain send failure, do not
  // automatically retry and risk duplicate emails; inspect it in Resend.
  await db.newsletterDispatch.create({
    data: { date, broadcastId: broadcast.id },
  });
  await resendRequest(`/broadcasts/${broadcast.id}/send`, {
    method: 'POST',
    body: {},
  });
  await db.newsletterDispatch.update({
    where: { date },
    data: { sentAt: new Date() },
  });
  return active.length;
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
