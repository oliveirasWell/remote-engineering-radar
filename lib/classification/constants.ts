/**
 * One vocabulary, two kinds. `focus` names decide React-track relevance;
 * `cloud` names are displayed and filterable but must never make a job
 * relevant on their own, because almost every competing-stack job mentions
 * Docker or AWS in passing.
 */
export const TECHNOLOGY_PATTERNS = [
  { name: 'React Native', kind: 'focus', pattern: /\breact\s*native\b/i },
  { name: 'React', kind: 'focus', pattern: /\breact\b(?!\s*native)/i },
  {
    name: 'TypeScript',
    kind: 'focus',
    pattern: /\btypescript\b|\bts\b(?=[\s,./|]|$)/i,
  },
  { name: 'Node.js', kind: 'focus', pattern: /\bnode\.?js\b|\bnodejs\b/i },
  { name: 'GraphQL', kind: 'focus', pattern: /\bgraphql\b/i },
  { name: 'Apollo', kind: 'focus', pattern: /\bapollo\b/i },
  { name: 'Jest', kind: 'focus', pattern: /\bjest\b/i },
  {
    name: 'React Testing Library',
    kind: 'focus',
    pattern: /\breact testing library\b|\b@testing-library\/react\b/i,
  },
  { name: 'Expo', kind: 'focus', pattern: /\bexpo\b/i },
  { name: 'AWS', kind: 'cloud', pattern: /\baws\b|\bamazon web services\b/i },
  { name: 'Kubernetes', kind: 'cloud', pattern: /\bkubernetes\b|\bk8s\b/i },
  { name: 'Terraform', kind: 'cloud', pattern: /\bterraform\b/i },
  { name: 'Docker', kind: 'cloud', pattern: /\bdocker\b/i },
  { name: 'Azure', kind: 'cloud', pattern: /\bazure\b/i },
  { name: 'GCP', kind: 'cloud', pattern: /\bgcp\b|\bgoogle cloud\b/i },
  { name: 'Ansible', kind: 'cloud', pattern: /\bansible\b/i },
] as const;

export const TECHNOLOGY_NAMES = TECHNOLOGY_PATTERNS.map((entry) => entry.name);

const namesOfKind = (kind: (typeof TECHNOLOGY_PATTERNS)[number]['kind']) =>
  TECHNOLOGY_PATTERNS.filter((entry) => entry.kind === kind).map(
    (entry) => entry.name,
  );

export const FOCUS_TECHNOLOGY_NAMES = namesOfKind('focus');

export const CLOUD_TECHNOLOGY_NAMES = namesOfKind('cloud');

/**
 * Only focus names count. Adding cloud names here would short-circuit
 * `isUnrelatedStack` for every Java, Go or .NET job that mentions Docker.
 */
export const RELEVANT_TECHNOLOGY_NAMES: ReadonlySet<string> = new Set(
  FOCUS_TECHNOLOGY_NAMES,
);

export const JOB_SENIORITY_LEVELS = [
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
] as const;

export const JOB_REMOTE_POLICIES = ['remote', 'hybrid', 'onsite'] as const;

/** The role-focus value that marks the Cloud & Ops track. */
export const PLATFORM_ROLE_FOCUS = 'platform' as const;

/** The role-focus value that marks the Data Annotation track. */
export const DATA_ANNOTATION_ROLE_FOCUS = 'annotation' as const;

/**
 * The role-focus value that marks a software job: a software title, a
 * frontend/backend/fullstack focus, or a React-stack technology. It is a
 * signal, not a track: it keeps an obviously technical title off the
 * unrelated-role list, and no chip is built on it.
 */
export const SOFTWARE_ROLE_FOCUS = 'software' as const;

/** The role-focus value that marks the Product track. */
export const PRODUCT_ROLE_FOCUS = 'product' as const;

/** The role-focus value that marks the React Engineering track. */
export const REACT_ROLE_FOCUS = 'react' as const;

/** The role-focus value that marks the Mobile track. */
export const MOBILE_ROLE_FOCUS = 'mobile' as const;

export const UNRELATED_STACK_PATTERNS = [
  /\bdata engineer(?:ing)?\b|\betl\b|\bspark\b|\bairflow\b/i,
  /\bqa engineer\b|\bquality assurance\b|\btest automation engineer\b/i,
  // No mobile-framework exception here: a posting that names iOS or Android
  // is on the Mobile track, and a track is never judged by its stack.
  /\bandroid\b/i,
  /\bios\b/i,
  /\bswift\b|\bkotlin\b|\bjava\b(?!script)/i,
  /\bruby on rails\b|\b\.net\b|\bc#\b|\bgolang\b|\bgo engineer\b/i,
] as const;
