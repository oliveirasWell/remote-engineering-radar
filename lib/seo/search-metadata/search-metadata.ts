import 'server-only';
import type { Metadata } from 'next';
import { messagesFor, type Locale } from '@/lib/i18n/messages';
import { canonicalMetadata } from '../canonical-metadata/canonical-metadata';
import { MIN_INDEXABLE_JOBS } from '../constants';
import { filterJobCount } from '../filter-job-count';
import {
  singleIndexableFilter,
  type IndexableFilter,
} from '../indexable-filter/indexable-filter';

type SearchView = 'companies' | 'jobs';

type Messages = ReturnType<typeof messagesFor>;

const baseCopy = (
  view: SearchView,
  messages: Messages,
): { title: string; description?: string } =>
  view === 'companies'
    ? { title: messages.seo.homeTitle }
    : { title: messages.jobs.metaTitle, description: messages.jobs.subtitle };

const filterCopy = (
  view: SearchView,
  filter: IndexableFilter,
  { seo, countries, focus: tracks }: Messages,
) => {
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
 * Title, description, canonical, language alternates, and robots for a
 * report view. The unfiltered view and single country or focus views with
 * enough jobs are indexed; every other combination is noindex.
 */
export const searchMetadata = async (
  view: SearchView,
  path: string,
  filters: Record<string, string | number | undefined>,
  locale: Locale,
): Promise<Metadata> => {
  const messages = messagesFor(locale);
  const isUnfiltered = Object.values(filters).every(
    (value) => value === undefined,
  );
  const filter = singleIndexableFilter(filters);
  const index =
    isUnfiltered ||
    (filter !== undefined &&
      (await filterJobCount(filter)) >= MIN_INDEXABLE_JOBS);

  return {
    ...baseCopy(view, messages),
    ...(filter ? filterCopy(view, filter, messages) : {}),
    ...canonicalMetadata(path, filters, index, locale),
  };
};
