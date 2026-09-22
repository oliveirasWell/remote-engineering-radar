import 'server-only';
import type { Metadata } from 'next';
import { EN_MESSAGES } from '@/lib/i18n/messages';
import { canonicalMetadata } from '../canonical-metadata/canonical-metadata';
import { MIN_INDEXABLE_JOBS } from '../constants';
import { filterJobCount } from '../filter-job-count';
import {
  singleIndexableFilter,
  type IndexableFilter,
} from '../indexable-filter/indexable-filter';

type SearchView = 'companies' | 'jobs';

const { seo, countries, focus: tracks } = EN_MESSAGES;

const BASE_COPY: Record<SearchView, { title: string; description?: string }> = {
  companies: { title: seo.homeTitle },
  jobs: {
    title: EN_MESSAGES.jobs.metaTitle,
    description: EN_MESSAGES.jobs.subtitle,
  },
};

const filterCopy = (view: SearchView, filter: IndexableFilter) => {
  if (filter.country) {
    const place = countries[filter.country];
    return view === 'companies'
      ? {
          title: seo.countryCompaniesTitle(place),
          description: seo.countryCompaniesDescription(place),
        }
      : {
          title: seo.countryJobsTitle(place),
          description: seo.countryJobsDescription(place),
        };
  }
  const track = tracks[filter.focus];
  return view === 'companies'
    ? {
        title: seo.focusCompaniesTitle(track),
        description: seo.focusCompaniesDescription(track),
      }
    : {
        title: seo.focusJobsTitle(track),
        description: seo.focusJobsDescription(track),
      };
};

/**
 * Title, description, canonical, and robots for a report view. The
 * unfiltered view and single country or focus views with enough jobs are
 * indexed; every other combination is noindex.
 */
export const searchMetadata = async (
  view: SearchView,
  path: string,
  filters: Record<string, string | number | undefined>,
): Promise<Metadata> => {
  const isUnfiltered = Object.values(filters).every(
    (value) => value === undefined,
  );
  const filter = singleIndexableFilter(filters);
  const index =
    isUnfiltered ||
    (filter !== undefined &&
      (await filterJobCount(filter)) >= MIN_INDEXABLE_JOBS);

  return {
    ...BASE_COPY[view],
    ...(filter ? filterCopy(view, filter) : {}),
    ...canonicalMetadata(path, filters, index),
  };
};
