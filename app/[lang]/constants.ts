import { EN_MESSAGES, type Locale } from '@/lib/i18n/messages';

export const APP_NAME = EN_MESSAGES.app.name;

export const FOCUS_TECHNOLOGIES = [
  'React',
  'TypeScript',
  'Node.js',
  'GraphQL',
  'React Native',
] as const;

export const APP_DESCRIPTION = EN_MESSAGES.app.description;

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  'pt-BR': 'pt_BR',
};
