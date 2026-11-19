import type { ReactNode } from 'react';
import { HomeHeading } from './home-presentation';

export const renderHomeContent = (section: ReactNode) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
    <HomeHeading />
    {section}
  </main>
);
