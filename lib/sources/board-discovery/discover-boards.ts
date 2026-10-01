import type { RootDb } from '@/lib/db/client';
import {
  createAtsBoardsRepository,
  type Ats,
} from '@/lib/db/repositories/ats-boards-repository';
import { normalizeJobTitle } from '@/lib/deduplication/normalize';
import { createAshbyAdapter } from '../ashby/ashby-adapter';
import { createGreenhouseAdapter } from '../greenhouse/greenhouse-adapter';
import { createLeverAdapter } from '../lever/lever-adapter';
import type { JobSource } from '../types';
import { buildSlugCandidates } from './build-slug-candidates';
import {
  BOARD_DISCOVERY_BUDGET_MS,
  BOARD_PROBE_DELAY_MS,
  BOARD_RECHECK_DAYS,
} from './constants';

type DiscoveryOptions = {
  db: RootDb;
  fetch?: typeof fetch;
  now?: Date;
  budgetMs?: number;
  delayMs?: number;
};

type ProbeOutcome = { verified: number; conclusive: boolean };

const DAY_MS = 86_400_000;

const probeCompany = async (
  company: { id: string; name: string },
  titles: Set<string>,
  adapters: Array<[Ats, (slug: string) => JobSource]>,
  deadline: number,
  insertVerified: (
    ats: Ats,
    slug: string,
    companyId: string,
  ) => Promise<boolean>,
): Promise<ProbeOutcome> => {
  const slugs = buildSlugCandidates(company.name);
  const state = { pending: false };
  for (const [ats, adapter] of adapters) {
    for (const slug of slugs) {
      if (performance.now() >= deadline) {
        return { verified: 0, conclusive: false };
      }
      const { jobs, failedBoards } = await adapter(slug).fetchJobs();
      const failure = failedBoards?.[0];
      state.pending ||= failure !== undefined && failure.status !== 404;
      if (failure) {
        continue;
      }
      if (jobs.some((job) => titles.has(normalizeJobTitle(job.title)))) {
        return {
          verified: Number(await insertVerified(ats, slug, company.id)),
          conclusive: true,
        };
      }
    }
  }
  return { verified: 0, conclusive: !state.pending };
};

export const discoverBoards = async (
  options: DiscoveryOptions,
): Promise<{ checked: number; verified: number }> => {
  const repository = createAtsBoardsRepository(options.db);
  const now = options.now ?? new Date();
  const deadline =
    performance.now() + (options.budgetMs ?? BOARD_DISCOVERY_BUDGET_MS);
  const delayMs = options.delayMs ?? BOARD_PROBE_DELAY_MS;
  const fetchImpl = options.fetch ?? fetch;
  const state = { requested: false };
  const limitedFetch: typeof fetch = async (input, init) => {
    if (state.requested && delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.min(delayMs, Math.max(0, deadline - performance.now())),
        ),
      );
    }
    state.requested = true;
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      throw new Error('Board discovery budget exceeded');
    }
    return fetchImpl(input, {
      ...init,
      signal: AbortSignal.any([
        ...(init?.signal ? [init.signal] : []),
        AbortSignal.timeout(Math.max(1, Math.ceil(remaining))),
      ]),
    });
  };

  const adapters: Array<[Ats, (slug: string) => JobSource]> = [
    [
      'greenhouse',
      (slug) =>
        createGreenhouseAdapter({
          boardTokens: [slug],
          fetch: limitedFetch,
          logFailures: false,
        }),
    ],
    [
      'ashby',
      (slug) =>
        createAshbyAdapter({
          boardNames: [slug],
          fetch: limitedFetch,
          logFailures: false,
        }),
    ],
    [
      'lever',
      (slug) =>
        createLeverAdapter({
          boardSlugs: [slug],
          fetch: limitedFetch,
          logFailures: false,
        }),
    ],
  ];

  const stats = { checked: 0, verified: 0 };
  const candidates = await repository.listCandidates(
    new Date(now.getTime() - BOARD_RECHECK_DAYS * DAY_MS),
  );
  for (const company of candidates) {
    if (performance.now() >= deadline) {
      break;
    }
    stats.checked++;
    try {
      const titles = new Set(
        (await repository.listEvidenceTitles(company.id))
          .map(normalizeJobTitle)
          .filter(Boolean),
      );
      const outcome = await probeCompany(
        company,
        titles,
        adapters,
        deadline,
        repository.insertVerified,
      );
      stats.verified += outcome.verified;
      if (outcome.conclusive) {
        await repository.markChecked(company.id, now);
      }
    } catch (error) {
      console.error(
        `Board discovery for ${company.name} failed: ${String(error)}`,
      );
    }
  }
  return stats;
};
