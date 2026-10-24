import { LOCALES, messagesFor } from '@/lib/i18n/messages';
import { explanationForReason } from './explanation-for-reason';

const TECHNOLOGY = 'React';

describe('explanationForReason', () => {
  it.each(LOCALES)(
    'explains every classifier reason and names other signals as technologies in %s',
    (locale) => {
      const { jobDetail, jobReasons } = messagesFor(locale);

      for (const reason of Object.keys(jobReasons)) {
        const written = explanationForReason(
          reason,
          jobDetail.reasonText,
          jobDetail.technology,
        );
        expect(written.length).toBeGreaterThan(40);
        expect(written).not.toBe(jobDetail.technology(reason));
      }

      expect(
        explanationForReason(
          TECHNOLOGY,
          jobDetail.reasonText,
          jobDetail.technology,
        ),
      ).toBe(jobDetail.technology(TECHNOLOGY));
    },
  );
});
