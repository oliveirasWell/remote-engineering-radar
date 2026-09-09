'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { LanguagePicker } from '@/components/i18n/LanguagePicker/LanguagePicker';

export const SiteHeader = () => {
  const { messages } = useI18n();

  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <nav
        aria-label={messages.navigation.label}
        className="flex flex-wrap items-center gap-4 text-sm"
      >
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2"
        >
          {messages.navigation.companies}
        </Link>
        <Link
          href="/jobs"
          className="inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2"
        >
          {messages.navigation.jobs}
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[44px] items-center rounded bg-primary px-4 py-2 font-medium text-primary-foreground"
        >
          {messages.navigation.about}
        </Link>
      </nav>
      <LanguagePicker />
    </header>
  );
};
