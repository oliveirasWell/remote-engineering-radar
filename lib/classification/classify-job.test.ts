import { classifyJob, shouldPersistClassifiedJob } from './classify-job';

const GEOGRAPHY_JOB_TITLE = 'Senior React Engineer';
const BRAZIL_LOCATIONS = ['Brazil', 'Brasil', 'Sao Paulo', 'LATAM - Brazil'];
const BRAZIL_GEOGRAPHY = 'brazil';
const LATAM_GEOGRAPHY = 'latam';
const ADVERSARIAL_LATAM_TEXT = 'LATAM '.repeat(40_000);
const CLASSIFICATION_BUDGET_MS = 500;
const CLOUD_OPS_JOB_TITLE = 'Senior DevOps Engineer';
const CLOUD_OPS_DESCRIPTION =
  'Own our AWS footprint, run Kubernetes in production, and manage infrastructure as code with Terraform. Docker experience required.';
const PLATFORM_ROLE_FOCUS = 'platform';
const DATA_ANNOTATION_ROLE_FOCUS = 'annotation';
const PRODUCT_ROLE_FOCUS = 'product';
const PRODUCT_MANAGER_TITLES = [
  'Senior Product Manager',
  'Technical Product Manager - Payments',
  'Product Owner',
  'Group Product Manager',
  'Head of Product',
];
const PRODUCT_MARKETING_TITLE = 'Product Marketing Manager';
const PRODUCT_ENGINEER_TITLE = 'Senior Product Engineer';
const QUAVE_ANNOTATION_TITLE = 'Senior Full-Stack Engineer';
const QUAVE_ANNOTATION_DESCRIPTION =
  'Work with a US client developing AI training and evaluation data for coding agents. React, TypeScript, and Node.js.';

describe('classifyJob', () => {
  it.each(BRAZIL_LOCATIONS)('recognizes Brazil in %s', (location) => {
    expect(
      classifyJob({ title: GEOGRAPHY_JOB_TITLE, location }).geography,
    ).toContain(BRAZIL_GEOGRAPHY);
  });

  it('classifies repeated LATAM mentions without quadratic work or inventing Brazil', () => {
    const start = performance.now();
    const result = classifyJob({
      title: GEOGRAPHY_JOB_TITLE,
      description: ADVERSARIAL_LATAM_TEXT,
    });
    const elapsedMs = performance.now() - start;

    expect(result.geography).toEqual([LATAM_GEOGRAPHY]);
    expect(elapsedMs).toBeLessThan(CLASSIFICATION_BUDGET_MS);
  });

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

  it('classifies a DevOps role as a platform focus instead of an unrelated stack', () => {
    const result = classifyJob({
      title: CLOUD_OPS_JOB_TITLE,
      description: CLOUD_OPS_DESCRIPTION,
    });

    expect(result.roleFocus).toContain(PLATFORM_ROLE_FOCUS);
    expect(result.isUnrelatedStack).toBe(false);
    expect(result.technologies).toEqual(
      expect.arrayContaining(['AWS', 'Kubernetes', 'Terraform', 'Docker']),
    );
  });

  it.each([
    'Site Reliability Engineer',
    'Platform Engineer',
    'Cloud Engineer',
    'Infrastructure Engineer',
    'Senior SRE',
  ])('classifies %s as a platform focus', (title) => {
    expect(classifyJob({ title }).roleFocus).toContain(PLATFORM_ROLE_FOCUS);
  });

  it('keeps a platform role whose body mentions a competing language', () => {
    const result = classifyJob({
      title: CLOUD_OPS_JOB_TITLE,
      description: 'Automate deploys for our Java and Kotlin services on GCP.',
    });

    expect(result.isUnrelatedStack).toBe(false);
    expect(shouldPersistClassifiedJob(result)).toBe(true);
  });

  it('does not put a React role on the platform track for mentioning cloud tooling', () => {
    const result = classifyJob({
      title: 'Senior Frontend Engineer',
      description:
        'Build our React and TypeScript app. We deploy with Docker on AWS.',
    });

    expect(result.roleFocus).not.toContain(PLATFORM_ROLE_FOCUS);
    expect(result.technologies).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Docker', 'AWS']),
    );
  });

  it('still rejects a competing-stack role that merely mentions cloud tooling', () => {
    const result = classifyJob({
      title: 'Senior Backend Engineer',
      description: 'Java and Spring services deployed on Kubernetes.',
    });

    expect(result.roleFocus).not.toContain(PLATFORM_ROLE_FOCUS);
    expect(result.isUnrelatedStack).toBe(true);
    expect(shouldPersistClassifiedJob(result)).toBe(false);
  });

  it('puts an engineering role that produces AI training data on the annotation track', () => {
    const result = classifyJob({
      title: QUAVE_ANNOTATION_TITLE,
      description: QUAVE_ANNOTATION_DESCRIPTION,
    });

    expect(result.roleFocus).toContain(DATA_ANNOTATION_ROLE_FOCUS);
  });

  it.each([
    'AI Response Labeler / Annotator – Korean Specialty',
    'Bengali Transcription and Annotation Expert',
    'Freelance AI Trainer - Python',
    'Data Labeling Specialist',
    'RLHF Evaluator',
  ])('classifies %s as an annotation focus', (title) => {
    expect(classifyJob({ title }).roleFocus).toContain(
      DATA_ANNOTATION_ROLE_FOCUS,
    );
  });

  it('does not put a role on the annotation track for a passing mention of annotations', () => {
    const result = classifyJob({
      title: 'Technical Writer',
      description: 'Annotate code samples and review API docs.',
    });

    expect(result.roleFocus).not.toContain(DATA_ANNOTATION_ROLE_FOCUS);
  });

  it('keeps an annotation role whose body mentions a competing language', () => {
    const result = classifyJob({
      title: 'Freelance AI Trainer',
      description: 'Review and rank Java and Kotlin code written by LLMs.',
    });

    expect(result.isUnrelatedStack).toBe(false);
    expect(shouldPersistClassifiedJob(result)).toBe(true);
  });

  it.each(PRODUCT_MANAGER_TITLES)('puts %s on the product track', (title) => {
    expect(classifyJob({ title }).roleFocus).toContain(PRODUCT_ROLE_FOCUS);
  });

  it.each([PRODUCT_MARKETING_TITLE, PRODUCT_ENGINEER_TITLE])(
    'keeps %s off the product track',
    (title) => {
      expect(classifyJob({ title }).roleFocus).not.toContain(
        PRODUCT_ROLE_FOCUS,
      );
    },
  );

  it('keeps a product role whose body mentions a competing language', () => {
    const result = classifyJob({
      title: 'Senior Product Manager',
      description: 'Partner with our Java and Kotlin platform teams.',
    });

    expect(result.isUnrelatedStack).toBe(false);
    expect(shouldPersistClassifiedJob(result)).toBe(true);
  });
});
