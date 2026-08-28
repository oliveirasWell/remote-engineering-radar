import { detectHiringSignals } from './detect-hiring-signals';
import { HIRING_SIGNAL_TYPES } from './constants';

const daysAgo = (days: number, now = new Date()) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe('detectHiringSignals', () => {
  const now = new Date('2026-08-26T12:00:00Z');

  it('detects multiple engineering openings', () => {
    const jobs = Array.from({ length: 7 }, (_, index) => ({
      title: `Software Engineer ${index + 1}`,
      technologies: ['React'],
      isActive: true,
    }));

    const result = detectHiringSignals({
      companyName: 'Acme',
      jobs,
      now,
    });

    expect(result.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: HIRING_SIGNAL_TYPES.MULTIPLE_ENGINEERING_OPENINGS,
          description: 'Company currently has 7 engineering positions open.',
          score: 25,
        }),
      ]),
    );
    expect(result.summary).toBe('Strong hiring signal');
  });

  it('detects recent engineering hiring and technology clusters', () => {
    const result = detectHiringSignals({
      companyName: 'Acme',
      now,
      jobs: [
        {
          title: 'Senior Frontend Engineer',
          technologies: ['React', 'TypeScript'],
          postedAt: daysAgo(3, now),
          sourceUrl: 'https://example.com/jobs/frontend',
        },
        {
          title: 'Senior Backend Engineer',
          technologies: ['Node.js'],
          postedAt: daysAgo(5, now),
        },
        {
          title: 'Senior React Native Engineer',
          technologies: ['React Native'],
          postedAt: daysAgo(7, now),
        },
      ],
    });

    expect(result.signals.map((signal) => signal.type)).toEqual(
      expect.arrayContaining([
        HIRING_SIGNAL_TYPES.MULTIPLE_ENGINEERING_OPENINGS,
        HIRING_SIGNAL_TYPES.RECENT_ENGINEERING_HIRING,
        HIRING_SIGNAL_TYPES.RELEVANT_TECHNOLOGY_CLUSTER,
        HIRING_SIGNAL_TYPES.CROSS_FUNCTION_ENGINEERING_HIRING,
      ]),
    );
    expect(result.hiringScore).toBeGreaterThan(0);
    expect(
      result.signals.find(
        (signal) =>
          signal.type === HIRING_SIGNAL_TYPES.RECENT_ENGINEERING_HIRING,
      )?.sourceUrl,
    ).toBe('https://example.com/jobs/frontend');
  });

  it('detects engineering leadership hiring', () => {
    const result = detectHiringSignals({
      companyName: 'Acme',
      now,
      jobs: [
        {
          title: 'Staff Software Engineer',
          technologies: ['TypeScript'],
        },
        {
          title: 'Engineering Manager',
          technologies: [],
        },
      ],
    });

    expect(result.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: HIRING_SIGNAL_TYPES.ENGINEERING_LEADERSHIP_HIRING,
        }),
      ]),
    );
  });

  it('returns an empty signal set when evidence is weak', () => {
    const result = detectHiringSignals({
      companyName: 'Acme',
      now,
      jobs: [
        {
          title: 'Account Executive',
          technologies: [],
        },
      ],
    });

    expect(result.signals).toEqual([]);
    expect(result.hiringScore).toBe(0);
    expect(result.summary).toBe(
      'No strong engineering hiring signal detected.',
    );
  });
});
