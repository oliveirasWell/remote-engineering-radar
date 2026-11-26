import { DEFAULT_LOCALE } from '@/lib/i18n/messages';
import { DIGEST_SEGMENT_EN, DIGEST_SEGMENT_PT } from '../digest-email/fixtures';
import {
  configuredSegmentIds,
  digestLocale,
  SEGMENT_ENV_BY_LOCALE,
  segmentIdForLocale,
} from './segment-for-locale';

const UNSUPPORTED = ['', 'pt', 'fr', null];

beforeEach(() => {
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE.en, DIGEST_SEGMENT_EN);
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE['pt-BR'], DIGEST_SEGMENT_PT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it.each(UNSUPPORTED)('reads %j as English', (value) => {
  expect(digestLocale(value)).toBe(DEFAULT_LOCALE);
});

it('reads a stored locale and the segment configured for it', () => {
  expect(digestLocale('pt-BR')).toBe('pt-BR');
  expect(segmentIdForLocale('pt-BR')).toBe(DIGEST_SEGMENT_PT);
  expect(segmentIdForLocale('en')).toBe(DIGEST_SEGMENT_EN);
  expect(configuredSegmentIds()).toEqual([
    DIGEST_SEGMENT_EN,
    DIGEST_SEGMENT_PT,
  ]);
});

it('requires the Portuguese segment when a subscriber needs it', () => {
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE['pt-BR'], '');
  expect(configuredSegmentIds()).toEqual([DIGEST_SEGMENT_EN]);
  expect(() => segmentIdForLocale('pt-BR')).toThrow(
    SEGMENT_ENV_BY_LOCALE['pt-BR'],
  );
});
