import {
  RESEND_API_KEY_ENV,
  RESEND_FROM_ENV,
  RESEND_SEGMENT_ID_ENV,
  newsletterRequiresMessage,
} from './constants';
import { resendConfig, resendSegmentId } from './resend';

const API_KEY = 'test-api-key';
const SEGMENT_ID = 'test-segment';
const SENDER = 'Remote Engineering Radar <digest@mail.example.test>';
const BLANK_SENDERS = [undefined, '', '   '];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resendConfig', () => {
  it('returns the trimmed sender from RESEND_FROM', () => {
    vi.stubEnv(RESEND_API_KEY_ENV, API_KEY);
    vi.stubEnv(RESEND_FROM_ENV, ` ${SENDER} `);
    vi.stubEnv(RESEND_SEGMENT_ID_ENV, SEGMENT_ID);

    expect(resendConfig()).toEqual({
      key: API_KEY,
      from: SENDER,
      segmentId: SEGMENT_ID,
    });
  });

  it.each(BLANK_SENDERS)(
    'names RESEND_FROM when the sender is missing (%j)',
    (from) => {
      vi.stubEnv(RESEND_API_KEY_ENV, API_KEY);
      vi.stubEnv(RESEND_FROM_ENV, from);
      vi.stubEnv(RESEND_SEGMENT_ID_ENV, SEGMENT_ID);

      expect(resendConfig).toThrow(
        newsletterRequiresMessage([RESEND_FROM_ENV]),
      );
    },
  );

  it('names every missing sending variable', () => {
    vi.stubEnv(RESEND_API_KEY_ENV, '');
    vi.stubEnv(RESEND_FROM_ENV, '');
    vi.stubEnv(RESEND_SEGMENT_ID_ENV, '');

    expect(resendConfig).toThrow(
      newsletterRequiresMessage([
        RESEND_API_KEY_ENV,
        RESEND_FROM_ENV,
        RESEND_SEGMENT_ID_ENV,
      ]),
    );
  });
});

describe('resendSegmentId', () => {
  it('reads the segment without a sender', () => {
    vi.stubEnv(RESEND_SEGMENT_ID_ENV, ` ${SEGMENT_ID} `);

    expect(resendSegmentId()).toBe(SEGMENT_ID);
  });
});
