// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { messagesFor } from '@/lib/i18n/messages';
import { TEST_JOB_ID } from '@/lib/report/test-fixtures';
import { SiteHeader } from './SiteHeader';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

const { navigation } = messagesFor();
const LINKS = [
  { href: '/', label: navigation.companies },
  { href: '/jobs', label: navigation.jobs },
  { href: '/about', label: navigation.about },
];
const ROUTES = [
  { pathname: '/', activeHref: '/' },
  { pathname: '/jobs', activeHref: '/jobs' },
  { pathname: `/jobs/${TEST_JOB_ID}`, activeHref: '/jobs' },
  { pathname: '/about', activeHref: '/about' },
  { pathname: '/jobs-other', activeHref: undefined },
];

describe('SiteHeader navigation tabs', () => {
  it.each(ROUTES)(
    'marks only the active section for $pathname',
    ({ pathname, activeHref }) => {
      vi.mocked(usePathname).mockReturnValue(pathname);
      render(<SiteHeader />);
      const nav = within(
        screen.getByRole('navigation', { name: navigation.label }),
      );

      for (const { href, label } of LINKS) {
        const link = nav.getByRole('link', { name: label });
        expect(link).toHaveAttribute('href', href);
        expect(link).toHaveClass('min-h-[44px]');
        expect(link).not.toHaveClass('bg-primary');
        if (href === activeHref) {
          expect(link).toHaveAttribute('aria-current', 'page');
          expect(link).toHaveClass(
            'font-semibold',
            'text-foreground',
            'shadow-[inset_0_-2px_0_var(--primary)]',
          );
        } else {
          expect(link).not.toHaveAttribute('aria-current');
          expect(link).not.toHaveClass('font-semibold');
          expect(link).toHaveClass(
            'text-muted-foreground',
            'underline',
            'underline-offset-2',
          );
        }
      }
    },
  );

  it('updates the active tab when navigation changes the pathname', () => {
    vi.mocked(usePathname).mockReturnValue(LINKS[0].href);
    const { rerender } = render(<SiteHeader />);
    expect(screen.getByRole('link', { name: LINKS[0].label })).toHaveAttribute(
      'aria-current',
      'page',
    );

    vi.mocked(usePathname).mockReturnValue(LINKS[2].href);
    rerender(<SiteHeader />);
    expect(
      screen.getByRole('link', { name: LINKS[0].label }),
    ).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: LINKS[2].label })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps links and language controls visible while the pathname is suspended', () => {
    vi.mocked(usePathname).mockImplementation(() => {
      throw new Promise(() => {});
    });
    render(<SiteHeader />);
    for (const { label } of LINKS) {
      expect(screen.getByRole('link', { name: label })).not.toHaveAttribute(
        'aria-current',
      );
    }
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
