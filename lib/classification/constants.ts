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

/**
 * Matched against the title alone. A body that mentions "infrastructure" or
 * "cloud" describes a backend job's environment; a title that says so names
 * the discipline the job is actually for.
 */
export const CLOUD_OPS_ROLE_PATTERNS = [
  /\bdevops\b/i,
  /\bsite reliability\b|\bsre\b/i,
  /\bplatform\s+(?:engineer|engineering)\b/i,
  /\bcloud\s+(?:engineer|architect|infrastructure)\b/i,
  /\binfrastructure\s+engineer\b/i,
  /\bsystems?\s+engineer\b/i,
] as const;

/** The role-focus value that marks the Data Annotation track. */
export const DATA_ANNOTATION_ROLE_FOCUS = 'annotation' as const;

/** Matched against the title, which names the work outright. */
export const DATA_ANNOTATION_TITLE_PATTERNS = [
  /\bannotat(?:or|ors|ion)\b/i,
  /\bai\s+train(?:er|ing)\b/i,
  /\bdata\s+label(?:l)?(?:er|ing)\b/i,
  /\blabeler\b/i,
  /\brlhf\b/i,
] as const;

/**
 * Matched against the whole posting. Only full phrases: a bare "annotate" or
 * "RLHF" in a body shows up in technical-writer and ML-research jobs too.
 */
export const DATA_ANNOTATION_TEXT_PATTERNS = [
  /\bdata\s+annotation\b/i,
  /\bai\s+training\s+data\b/i,
  /\btraining\s+and\s+evaluation\s+data\b/i,
  /\bai\s+trainer\b/i,
] as const;

/** The role-focus value that marks the Product track. */
export const PRODUCT_ROLE_FOCUS = 'product' as const;

/**
 * Matched against the title alone: engineering bodies routinely mention
 * working with product managers. A neighbouring discipline ("Product Lead
 * Engineer", "Head of Product Design") names a different job, and "Product
 * Engineer" and "Product Marketing" titles never match.
 */
export const PRODUCT_ROLE_PATTERNS = [
  /\bproduct\s+(?:manager|owner|lead|director)\b(?!\s+(?:engineer|designer|developer)\b)/i,
  /\b(?:head|director|vp|vice\s+president)\s+of\s+product\b(?!\s+(?:engineering|design|designer|marketing|operations)\b)/i,
  /\bgerente\s+de\s+produto\b/i,
] as const;

export const UNRELATED_STACK_PATTERNS = [
  /\bdata engineer\b|\betl\b|\bspark\b|\bairflow\b/i,
  /\bqa engineer\b|\bquality assurance\b|\btest automation engineer\b/i,
  /\bandroid\b(?!.*(react native|expo))/i,
  /\bios\b(?!.*(react native|expo))/i,
  /\bswift\b|\bkotlin\b|\bjava\b(?!script)/i,
  /\bruby on rails\b|\b\.net\b|\bc#\b|\bgolang\b|\bgo engineer\b/i,
] as const;

export const UNRELATED_ROLE_PATTERNS = [
  /\bsales\s+representative\b/i,
  /\baccount\s+executive\b/i,
  /\b(?:sdr|bdr)\b/i,
  /\b(?:sales\s+development|business\s+development)\s+representative\b/i,
  /\bsales\s+(?:manager|director|engineer|associate|executive)\b/i,
  /\brecruiter\b|\btalent\s+acquisition\b|\bpeople\s+partner\b/i,
  /\bcustomer\s+success\b/i,
  /\baccount\s+manager\b/i,
  /\b(?:marketing\s+manager|growth\s+marketing|product\s+marketing|content\s+marketing)\b/i,
  /\brepresentante\s+comercial\b|\bvendedor\b/i,
] as const;
