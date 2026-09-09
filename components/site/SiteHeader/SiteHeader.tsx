'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { LanguagePicker } from '@/components/i18n/LanguagePicker/LanguagePicker';

const NavigationLinks = ({ pathname }: { pathname?: string | null }) => {
  const { messages } = useI18n();
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
          pathname === href ||
          (href !== '/' && pathname?.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
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

export const SiteHeader = () => (
  <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
    {/* Dynamic job routes suspend pathname reads during prerendering. */}
    <Suspense fallback={<NavigationLinks />}>
      <ActiveNavigation />
    </Suspense>
    <LanguagePicker />
  </header>
);
