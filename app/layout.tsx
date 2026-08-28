import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist } from 'next/font/google';
import { APP_DESCRIPTION, APP_NAME } from './constants';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
