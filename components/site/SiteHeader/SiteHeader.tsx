'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import {
  LanguageLinks,
  LanguagePicker,
} from '@/components/i18n/LanguagePicker/LanguagePicker';
import {
  localizedPath,
  unlocalizedPath,
} from '@/lib/i18n/localized-path/localized-path';
import { SiteWordmark } from '@/components/site/SiteWordmark/SiteWordmark';

const NavigationLinks = ({ pathname }: { pathname?: string | null }) => {
  const { locale, messages } = useI18n();
  const sharedPath = pathname ? unlocalizedPath(pathname) : undefined;
  const links = [
    { href: '/', label: messages.navigation.companies },
    { href: '/jobs', label: messages.navigation.jobs },
    { href: '/about', label: messages.navigation.about },
  ];

  return (
    <nav
      aria-label={messages.navigation.label}
      className="flex flex-wrap items-center gap-4 text-sm"
    >
      {links.map(({ href, label }) => {
        const selected =
          sharedPath === href ||
          (href !== '/' && sharedPath?.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={localizedPath(locale, href)}
            aria-current={selected ? 'page' : undefined}
            className={
              selected
                ? 'inline-flex min-h-[44px] items-center font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]'
                : 'inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2'
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

const ActiveNavigation = () => <NavigationLinks pathname={usePathname()} />;

export const SiteHeader = () => {
  const { locale } = useI18n();
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <Link
        href={localizedPath(locale, '/')}
        className="inline-flex items-center"
      >
        <SiteWordmark className="text-base" />
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        {/* Dynamic job routes suspend pathname reads during prerendering. */}
        <Suspense fallback={<NavigationLinks />}>
          <ActiveNavigation />
        </Suspense>
        <Suspense fallback={<LanguageLinks sharedPath="/" />}>
          <LanguagePicker />
        </Suspense>
      </div>
    </header>
  );
};
