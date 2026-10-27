'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { editorialFor } from '@/lib/i18n/editorial';
import { LOCALE_COOKIE } from '@/lib/i18n/messages';
import {
  ADSENSE_CLIENT_ID,
  GOOGLE_AD_COOKIES_URL,
  GOOGLE_ADS_SETTINGS_URL,
} from '@/lib/marketing/adsense';
import { GA_MEASUREMENT_ID } from '@/components/observability/GoogleAnalytics/constants';
import { CONTACT_EMAIL } from '@/components/site/constants';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';

const TEXT_LINK = 'text-muted-foreground underline underline-offset-2';

export const PrivacyContent = () => {
  const { locale, messages } = useI18n();
  const { privacy } = editorialFor(locale);
  const facts = [
    { label: privacy.cookieLabel, value: LOCALE_COOKIE },
    { label: privacy.publisherLabel, value: ADSENSE_CLIENT_ID },
    { label: privacy.analyticsLabel, value: GA_MEASUREMENT_ID },
    { label: messages.about.contactEmailLabel, value: CONTACT_EMAIL },
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <PageTitle as="h1">{privacy.title}</PageTitle>
        <p className="text-lg text-muted-foreground">{privacy.introduction}</p>
      </header>
      {privacy.sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <dl className="space-y-3 text-sm">
        {facts.map(({ label, value }) => (
          <div key={label}>
            <dt className="font-medium">{label}</dt>
            <dd className="text-muted-foreground">
              {label === messages.about.contactEmailLabel ? (
                <a href={`mailto:${value}`} className={TEXT_LINK}>
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="flex flex-col gap-2 text-sm">
        {isSafeExternalUrl(GOOGLE_ADS_SETTINGS_URL) ? (
          <a
            href={GOOGLE_ADS_SETTINGS_URL}
            target="_blank"
            rel="noreferrer"
            className={TEXT_LINK}
          >
            {privacy.adsSettingsLabel}
          </a>
        ) : null}
        {isSafeExternalUrl(GOOGLE_AD_COOKIES_URL) ? (
          <a
            href={GOOGLE_AD_COOKIES_URL}
            target="_blank"
            rel="noreferrer"
            className={TEXT_LINK}
          >
            {privacy.adCookiesLabel}
          </a>
        ) : null}
      </p>
    </main>
  );
};
