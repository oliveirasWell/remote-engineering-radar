import { classifyJob, shouldPersistClassifiedJob } from './classify-job';

describe('classifyJob', () => {
  it('classifies Senior React + TypeScript', () => {
    const result = classifyJob({
      title: 'Senior Software Engineer, Frontend',
      description: 'React and TypeScript required',
    });

    expect(result.seniority).toBe('senior');
    expect(result.technologies).toEqual(
      expect.arrayContaining(['React', 'TypeScript']),
    );
    expect(result.roleFocus).toContain('frontend');
  });

  it('classifies Senior React + Node + GraphQL', () => {
    const result = classifyJob({
      title: 'Senior Software Engineer',
      description: 'React, Node.js, and GraphQL',
    });

    expect(result.seniority).toBe('senior');
    expect(result.technologies).toEqual(
      expect.arrayContaining(['React', 'Node.js', 'GraphQL']),
    );
  });

  it('classifies Senior React Native', () => {
    const result = classifyJob({
      title: 'Senior React Native Engineer',
      description: 'Ship mobile apps',
    });

    expect(result.seniority).toBe('senior');
    expect(result.technologies).toContain('React Native');
    expect(result.roleFocus).toContain('mobile');
  });

  it('classifies Mid-level React', () => {
    const result = classifyJob({
      title: 'Mid-level React Engineer',
      description: 'React experience',
    });

    expect(result.seniority).toBe('mid');
    expect(result.technologies).toContain('React');
  });

  it('classifies Junior React', () => {
    const result = classifyJob({
      title: 'Junior React Developer',
      description: 'Entry-level React role',
    });

    expect(result.seniority).toBe('junior');
    expect(result.technologies).toContain('React');
  });

  it('classifies Senior unrelated backend role', () => {
    const result = classifyJob({
      title: 'Senior Data Engineer',
      description: 'Spark, Airflow, and ETL pipelines',
    });

    expect(result.seniority).toBe('senior');
    expect(result.isUnrelatedStack).toBe(true);
  });

  it('flags Sales Representative as an unrelated role', () => {
    const result = classifyJob({
      title: 'Sales Representative',
      description: 'Close deals with React product customers',
    });

    expect(result.isUnrelatedRole).toBe(true);
  });

  it('flags Account Executive and recruiter titles as unrelated roles', () => {
    expect(classifyJob({ title: 'Account Executive' }).isUnrelatedRole).toBe(
      true,
    );
    expect(classifyJob({ title: 'Technical Recruiter' }).isUnrelatedRole).toBe(
      true,
    );
    expect(
      classifyJob({ title: 'Customer Success Manager' }).isUnrelatedRole,
    ).toBe(true);
  });

  it('does not flag engineering titles as unrelated roles', () => {
    const result = classifyJob({
      title: 'Senior Frontend Engineer',
      description: 'React and TypeScript',
    });

    expect(result.isUnrelatedRole).toBe(false);
  });

  it('exposes shouldPersistClassifiedJob for ingest gating', () => {
    expect(
      shouldPersistClassifiedJob(
        classifyJob({ title: 'Sales Representative' }),
      ),
    ).toBe(false);
    expect(
      shouldPersistClassifiedJob(
        classifyJob({
          title: 'Senior Data Engineer',
          description: 'Spark and Airflow',
        }),
      ),
    ).toBe(false);
    expect(
      shouldPersistClassifiedJob(
        classifyJob({
          title: 'Senior Frontend Engineer',
          description: 'React and TypeScript',
        }),
      ),
    ).toBe(true);
  });

  it('classifies Remote React LATAM', () => {
    const result = classifyJob({
      title: 'Senior React Engineer',
      location: 'Remote - LATAM',
      remotePolicy: 'remote',
      description: 'React',
    });

    expect(result.remotePolicy).toBe('remote');
    expect(result.geography).toContain('latam');
    expect(result.technologies).toContain('React');
  });

  it('classifies On-site React', () => {
    const result = classifyJob({
      title: 'Senior React Engineer',
      location: 'ONSITE San Francisco',
      description: 'React in office',
    });

    expect(result.remotePolicy).toBe('onsite');
    expect(result.technologies).toContain('React');
  });

  it('classifies React Native + Expo', () => {
    const result = classifyJob({
      title: 'Senior Mobile Engineer',
      description: 'React Native and Expo',
    });

    expect(result.technologies).toEqual(
      expect.arrayContaining(['React Native', 'Expo']),
    );
  });

  it('classifies TypeScript + Node + GraphQL fullstack', () => {
    const result = classifyJob({
      title: 'Senior Fullstack Engineer',
      description: 'TypeScript, Node.js, GraphQL',
    });

    expect(result.seniority).toBe('senior');
    expect(result.roleFocus).toContain('fullstack');
    expect(result.technologies).toEqual(
      expect.arrayContaining(['TypeScript', 'Node.js', 'GraphQL']),
    );
  });
});
