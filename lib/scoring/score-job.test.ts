import { scoreJob } from './score-job';

describe('scoreJob', () => {
  it('scores a high-fit Senior React TypeScript GraphQL Remote LATAM job highly', () => {
    const result = scoreJob({
      title: 'Senior Frontend Engineer',
      description: 'React, TypeScript, GraphQL',
      location: 'Remote LATAM',
      remotePolicy: 'remote',
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        'React',
        'TypeScript',
        'GraphQL',
        'Senior',
        'Remote',
        'LATAM',
      ]),
    );
  });

  it('ranks high-fit jobs above weak-fit jobs', () => {
    const highFit = scoreJob({
      title: 'Senior Fullstack Engineer',
      description: 'React, TypeScript, Node.js, GraphQL',
      location: 'Remote - Brazil',
      remotePolicy: 'remote',
    });

    const weakFit = scoreJob({
      title: 'Software Engineer',
      description: 'Some JavaScript experience',
      location: 'Hybrid',
    });

    expect(highFit.score).toBeGreaterThan(weakFit.score);
  });

  it('keeps Junior React scores extremely low', () => {
    const result = scoreJob({
      title: 'Junior React Developer',
      description: 'React internship-friendly role',
      remotePolicy: 'remote',
    });

    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reasons).toContain('Junior');
  });

  it('strongly penalizes on-site-only roles', () => {
    const remote = scoreJob({
      title: 'Senior React Engineer',
      description: 'React and TypeScript',
      remotePolicy: 'remote',
    });

    const onsite = scoreJob({
      title: 'Senior React Engineer',
      description: 'React and TypeScript',
      location: 'ONSITE New York',
    });

    expect(onsite.score).toBeLessThan(remote.score);
    expect(onsite.reasons).toContain('On-site only');
  });

  it('prevents unrelated stacks from scoring high', () => {
    const result = scoreJob({
      title: 'Senior Data Engineer',
      description: 'Spark and Airflow ETL',
      remotePolicy: 'remote',
    });

    expect(result.score).toBeLessThan(40);
    expect(result.reasons).toContain('Unrelated stack');
  });

  it('is deterministic for the same input', () => {
    const input = {
      title: 'Senior React Native Engineer',
      description: 'React Native and Expo',
      location: 'Remote Americas',
      remotePolicy: 'remote' as const,
    };

    expect(scoreJob(input)).toEqual(scoreJob(input));
  });
});
