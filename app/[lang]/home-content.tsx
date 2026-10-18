import type { ReactNode } from 'react';
import { AdUnit } from '@/components/marketing/AdUnit/AdUnit';
import { ADSENSE_HOME_SLOT } from '@/lib/marketing/adsense';
import { HomeHeading } from './home-presentation';

export const renderHomeContent = (section: ReactNode) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
    <>
      <HomeHeading />
      <AdUnit
        placement="home"
        slot={ADSENSE_HOME_SLOT}
        preview={process.env.VERCEL_ENV === 'preview'}
      />
    </>
    {section}
  </main>
);
