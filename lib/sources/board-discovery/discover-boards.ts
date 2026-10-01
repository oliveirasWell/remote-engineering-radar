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
): Promise<number> => {
  const slugs = buildSlugCandidates(company.name);
  for (const [ats, adapter] of adapters) {
    for (const slug of slugs) {
      if (performance.now() >= deadline) {
        return 0;
      }
      const { jobs } = await adapter(slug).fetchJobs();
      if (jobs.length === 0) {
        continue;
      }
      return Number(
        jobs.some((job) => titles.has(normalizeJobTitle(job.title))) &&
          (await insertVerified(ats, slug, company.id)),
      );
    }
  }
  return 0;
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
      stats.verified += await probeCompany(
        company,
        titles,
        adapters,
        deadline,
        repository.insertVerified,
      );
    } catch (error) {
      console.error(
        `Board discovery for ${company.name} failed: ${String(error)}`,
      );
    } finally {
      await repository.markChecked(company.id, now);
    }
  }
  return stats;
};
