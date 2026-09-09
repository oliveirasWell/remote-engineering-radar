import {
  EN_MESSAGES,
  LOCALE_COOKIE,
  PT_BR_MESSAGES,
} from '@/lib/i18n/messages';
import { REPOSITORY_URL } from '@/components/site/constants';

export const I18N_TEST = {
  cookieName: LOCALE_COOKIE,
  english: 'en',
  portuguese: 'pt-BR',
  invalidLocale: 'fr',
  language: EN_MESSAGES.navigation.language,
  portugueseLanguage: PT_BR_MESSAGES.navigation.language,
  about: EN_MESSAGES.navigation.about,
  portugueseAbout: PT_BR_MESSAGES.navigation.about,
  github: EN_MESSAGES.navigation.github,
  repositoryUrl: REPOSITORY_URL,
  portugueseOpenRoles: PT_BR_MESSAGES.home.openRoles(7),
  portugueseError: PT_BR_MESSAGES.globalError.title,
  error: new Error('Test rendering failure'),
} as const;
