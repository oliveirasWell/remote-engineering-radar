'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { editorialFor } from '@/lib/i18n/editorial';
import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import {
  MULTIPLE_OPENINGS_THRESHOLD,
  RECENT_HIRING_WINDOW_MS,
  RECENT_OPENINGS_THRESHOLD,
  RELEVANT_TECH_JOB_THRESHOLD,
} from '@/lib/hiring-signals/constants';
import {
  SCORE_WEIGHT_GROUP_IDS,
  scoreWeightRows,
} from '@/lib/scoring/weight-rows/weight-rows';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const daysFromMillis = (milliseconds: number) => milliseconds / MS_PER_DAY;

export const HowItWorksContent = () => {
  const {
    locale,
    messages: { about },
  } = useI18n();
  const { guide } = editorialFor(locale);
  const rows = scoreWeightRows();
  const listingDays = daysFromMillis(JOB_MAX_AGE_MS);
  const signalDays = daysFromMillis(RECENT_HIRING_WINDOW_MS);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <PageTitle as="h1">{guide.title}</PageTitle>
        <p className="text-lg text-muted-foreground">{guide.introduction}</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{guide.curationTitle}</h2>
        <p className="text-muted-foreground">{guide.window(listingDays)}</p>
        {guide.curation.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{guide.scoreTitle}</h2>
          <p className="text-muted-foreground">{guide.scoreIntro}</p>
        </div>
        {SCORE_WEIGHT_GROUP_IDS.map((group) => (
          <div key={group} className="space-y-2">
            <h3 className="text-base font-medium">{guide.groups[group]}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 font-medium">{guide.signalColumn}</th>
                  <th className="py-2 text-right font-medium">
                    {guide.pointsColumn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.group === group)
                  .map((row) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="py-2">
                        {guide.weightLabels[row.id] ?? row.id}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {row.points}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{guide.signalsTitle}</h2>
        <p className="text-muted-foreground">
          {guide.signals({
            multiple: MULTIPLE_OPENINGS_THRESHOLD,
            recent: RECENT_OPENINGS_THRESHOLD,
            tech: RELEVANT_TECH_JOB_THRESHOLD,
            days: signalDays,
          })}
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{guide.useTitle}</h2>
        {guide.use.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{guide.sourcesTitle}</h2>
        <p className="text-muted-foreground">{guide.sourcesNote}</p>
        <ul className="space-y-3">
          {about.sources.map((source) => (
            <li key={source.name} className="text-muted-foreground">
              <span className="font-medium text-foreground">{source.name}</span>
              <span> — {source.description}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{guide.limitsTitle}</h2>
        {guide.limits.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
};
