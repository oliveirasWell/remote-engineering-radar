import { DEFAULT_LOCALE, isLocale, type Locale } from '../messages';

/** The locale of a page under app/[lang]; the layout 404s any other value. */
export const routeLocale = async (
  params: Promise<{ lang: string }>,
): Promise<Locale> => {
  const { lang } = await params;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
};
