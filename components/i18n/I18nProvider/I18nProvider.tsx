'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  isLocale,
  LOCALE_COOKIE,
  messagesFor,
  type Locale,
} from '@/lib/i18n/messages';
import { LOCALE_CHANGE_EVENT } from './constants';

const setLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
};

const I18nContext = createContext({
  locale: 'en' as Locale,
  messages: messagesFor(),
  setLocale,
});

const subscribe = (onChange: () => void) => {
  window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
};

const readLocale = (): Locale => {
  const value = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(value) ? value : 'en';
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const locale = useSyncExternalStore(
    subscribe,
    readLocale,
    () => 'en' as const,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext value={{ locale, messages: messagesFor(locale), setLocale }}>
      {children}
    </I18nContext>
  );
};

export const useI18n = () => useContext(I18nContext);
