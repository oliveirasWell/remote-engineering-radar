'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  messagesFor,
  type Locale,
} from '@/lib/i18n/messages';

/** Remembers a reader's choice so unprefixed URLs redirect them back. */
const rememberLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
};

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  messages: messagesFor(),
  rememberLocale,
});

/** The locale comes from the URL, so the server renders the right language. */
export const I18nProvider = ({
  locale = DEFAULT_LOCALE,
  children,
}: {
  locale?: Locale;
  children: ReactNode;
}) => (
  <I18nContext
    value={{ locale, messages: messagesFor(locale), rememberLocale }}
  >
    {children}
  </I18nContext>
);

export const useI18n = () => useContext(I18nContext);
