'use client';

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import type { LatestIngest } from '@/lib/report/types';

const subscribe = () => () => {};

export const LatestIngestNotice = ({ newJobs, completedAt }: LatestIngest) => {
  const {
    locale,
    messages: { home },
  } = useI18n();
  // The server cannot know the reader's time zone, so the time renders after hydration.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <p className="mx-auto w-full max-w-3xl px-6 pt-3 text-sm text-muted-foreground">
      {home.newJobs(newJobs)}
      {isClient ? (
        <>
          {' · '}
          <time dateTime={completedAt.toISOString()}>
            {new Intl.DateTimeFormat(locale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(completedAt)}
          </time>
        </>
      ) : null}
    </p>
  );
};
