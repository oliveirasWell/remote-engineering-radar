'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import {
  CONTACT_EMAIL,
  PERSONAL_SITE_URL,
  REPOSITORY_URL,
} from '@/components/site/constants';
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
        <p className="text-muted-foreground">{about.sourcesIntro}</p>
        <ul className="space-y-3">
          {about.sources.map((source) => (
            <li key={source.name} className="text-muted-foreground">
              <span className="font-medium text-foreground">{source.name}</span>
              <span className="text-muted-foreground">
                {' '}
                — {source.description}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.freshnessTitle}</h2>
        <p className="text-muted-foreground">{about.freshness}</p>
        <p className="text-muted-foreground">{about.scope}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.scoringTitle}</h2>
        <p className="text-muted-foreground">{about.scoring}</p>
        <p className="text-muted-foreground">{about.scoringJob}</p>
        <p className="text-muted-foreground">{about.scoringCompany}</p>
        <p className="text-muted-foreground">{about.applications}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{about.contactTitle}</h2>
        <p className="text-muted-foreground">{about.contact}</p>
        <p className="text-muted-foreground">
          {about.contactEmailLabel}:{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        {isSafeExternalUrl(PERSONAL_SITE_URL) ? (
          <p className="text-muted-foreground">
            {about.contactSiteLabel}:{' '}
            <a
              href={PERSONAL_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {PERSONAL_SITE_URL}
            </a>
          </p>
        ) : null}
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
