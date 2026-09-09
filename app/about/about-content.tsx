'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { REPOSITORY_URL } from '@/components/site/constants';
import { isSafeExternalUrl } from '@/lib/urls/external-url';

export const AboutContent = () => {
  const {
    messages: { about, navigation },
  } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <PageTitle as="h1">{about.title}</PageTitle>
        <p className="text-lg text-muted-foreground">{about.introduction}</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.sourcesTitle}</h2>
        <p className="text-muted-foreground">{about.sources}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.freshnessTitle}</h2>
        <p className="text-muted-foreground">{about.freshness}</p>
        <p className="text-muted-foreground">{about.scope}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.scoringTitle}</h2>
        <p className="text-muted-foreground">{about.scoring}</p>
        <p className="text-muted-foreground">{about.applications}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.repositoryTitle}</h2>
        <p className="text-muted-foreground">{about.repository}</p>
        {isSafeExternalUrl(REPOSITORY_URL) ? (
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline underline-offset-2"
          >
            {navigation.github}
          </a>
        ) : null}
      </section>
    </main>
  );
};
