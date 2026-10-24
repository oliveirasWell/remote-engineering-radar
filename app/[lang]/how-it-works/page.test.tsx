// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { editorialFor } from '@/lib/i18n/editorial';
import { LOCALES, messagesFor } from '@/lib/i18n/messages';
import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import {
  MULTIPLE_OPENINGS_THRESHOLD,
  RECENT_HIRING_WINDOW_MS,
  RECENT_OPENINGS_THRESHOLD,
  RELEVANT_TECH_JOB_THRESHOLD,
} from '@/lib/hiring-signals/constants';
import { SCORE_WEIGHTS } from '@/lib/scoring/constants';
import { scoreWeightRows } from '@/lib/scoring/weight-rows/weight-rows';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import HowItWorksPage, { generateMetadata } from './page';

vi.mock('@/lib/db/client', () => {
  throw new Error('The static guide route must not import the database');
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

describe('HowItWorksPage', () => {
  it.each(LOCALES)(
    'explains curation, live score weights, and hiring signals in %s',
    (locale) => {
      const { guide } = editorialFor(locale);
      const { about } = messagesFor(locale);
      render(
        <I18nProvider locale={locale}>
          <HowItWorksPage />
        </I18nProvider>,
      );

      expect(
        screen.getByRole('heading', { name: guide.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(guide.introduction)).toBeInTheDocument();
      expect(
        screen.getByText(guide.window(JOB_MAX_AGE_MS / MS_PER_DAY)),
      ).toBeInTheDocument();
      for (const paragraph of [
        ...guide.curation,
        ...guide.use,
        ...guide.limits,
      ]) {
        expect(screen.getByText(paragraph)).toBeInTheDocument();
      }
      expect(
        screen.getByText(
          guide.signals({
            multiple: MULTIPLE_OPENINGS_THRESHOLD,
            recent: RECENT_OPENINGS_THRESHOLD,
            tech: RELEVANT_TECH_JOB_THRESHOLD,
            days: RECENT_HIRING_WINDOW_MS / MS_PER_DAY,
          }),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(String(SCORE_WEIGHTS.technologies.React)).length,
      ).toBeGreaterThan(0);
      const reactRow = scoreWeightRows().find(({ id }) => id === 'React');
      expect(reactRow?.points).toBe(SCORE_WEIGHTS.technologies.React);
      expect(screen.getByText(about.sources[0].name)).toBeInTheDocument();
      for (const row of scoreWeightRows()) {
        const label = guide.weightLabels[row.id];
        if (label) {
          expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        }
      }
    },
  );

  it('publishes an indexable canonical for the guide', async () => {
    const locale = await routeLocale(Promise.resolve({ lang: 'en' }));
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: locale }),
    });

    expect(metadata).toMatchObject({
      title: messagesFor(locale).navigation.guide,
      description: editorialFor(locale).guide.introduction,
      alternates: { canonical: '/how-it-works' },
      robots: { index: true, follow: true },
    });
  });
});
