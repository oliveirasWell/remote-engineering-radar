'use client';

import { isLocale, LOCALES } from '@/lib/i18n/messages';
import { useI18n } from '../I18nProvider/I18nProvider';

export const LanguagePicker = () => {
  const { locale, messages, setLocale } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{messages.navigation.language}</span>
      <select
        value={locale}
        className="min-h-[44px] rounded border border-border bg-card px-2 py-2 text-foreground"
        onChange={({ target: { value } }) => {
          if (isLocale(value)) {
            setLocale(value);
          }
        }}
      >
        {LOCALES.map((value) => (
          <option key={value} value={value} lang={value}>
            {messages.navigation.languages[value]}
          </option>
        ))}
      </select>
    </label>
  );
};
