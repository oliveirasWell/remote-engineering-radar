'use client';

import { useI18n } from '../I18nProvider/I18nProvider';
import { LANGUAGE_OPTIONS } from './constants';

export const LanguagePicker = () => {
  const { locale, messages, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label={messages.navigation.language}
      className="inline-flex border border-border p-1 text-sm"
    >
      {LANGUAGE_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-label={messages.navigation.languages[value]}
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`min-h-[44px] min-w-[44px] cursor-pointer px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            locale === value
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
