import { foldText } from '@/lib/text/fold-text/fold-text';
import {
  DATA_ANNOTATION_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
  RELEVANT_TECHNOLOGY_NAMES,
  SOFTWARE_ROLE_FOCUS,
  TECHNOLOGY_PATTERNS,
  UNRELATED_STACK_PATTERNS,
} from './constants';
import type { JobClassification, JobRemotePolicy } from './types';
import { meetsReactTrackThreshold } from './react-track/react-track';
import { VOCABULARY } from './vocabulary/vocabulary';

export type ClassifyJobInput = {
  title: string;
  description?: string;
  location?: string;
  remotePolicy?: string;
  technologies?: string[];
};

const buildHaystack = (input: ClassifyJobInput): string =>
  [input.title, input.description, input.location, input.remotePolicy]
    .filter(Boolean)
    .join('\n');

const matchesAny = (patterns: readonly RegExp[], text: string): boolean =>
  patterns.some((pattern) => pattern.test(text));

/** First hit wins, most junior first, so "Senior Intern" stays junior. */
const SENIORITY_ORDER = [
  'junior',
  'mid',
  'principal',
  'staff',
  'senior',
] as const;

const classifySeniority = (
  title: string,
  haystack: string,
): JobClassification['seniority'] =>
  SENIORITY_ORDER.find(
    (level) =>
      matchesAny(VOCABULARY.seniority[level], haystack) ||
      matchesAny(VOCABULARY.seniorityTitle[level], title),
  );

/** Title and location name the work model; the most permissive wins. */
const TITLE_POLICY_ORDER = ['remote', 'hybrid', 'onsite'] as const;

/** A body mentioning remote work in passing must not outvote its stated model. */
const BODY_POLICY_ORDER = ['hybrid', 'onsite', 'remote'] as const;

const firstPolicy = (
  order: readonly JobRemotePolicy[],
  patterns: Record<JobRemotePolicy, readonly RegExp[]>,
  text: string,
): JobRemotePolicy | undefined =>
  order.find((policy) => matchesAny(patterns[policy], text));

const stripBenefitNoise = (text: string): string =>
  VOCABULARY.remote.benefitNoise.reduce(
    (remaining, pattern) =>
      remaining.replace(new RegExp(pattern.source, `${pattern.flags}g`), ' '),
    text,
  );

const classifyRemotePolicy = (
  input: ClassifyJobInput,
): JobClassification['remotePolicy'] => {
  const explicit = input.remotePolicy?.toLowerCase();
  if (explicit === 'remote' || explicit === 'hybrid' || explicit === 'onsite') {
    return explicit;
  }

  return (
    firstPolicy(
      TITLE_POLICY_ORDER,
      VOCABULARY.remote.title,
      foldText(
        [input.title, input.location, input.remotePolicy]
          .filter(Boolean)
          .join('\n'),
      ),
    ) ??
    firstPolicy(
      BODY_POLICY_ORDER,
      VOCABULARY.remote.body,
      stripBenefitNoise(foldText(input.description ?? '')),
    )
  );
};

const GEOGRAPHY_ORDER = ['brazil', 'latam', 'americas', 'worldwide'] as const;

const classifyGeography = (haystack: string): JobClassification['geography'] =>
  GEOGRAPHY_ORDER.filter((region) =>
    matchesAny(VOCABULARY.geography[region], haystack),
  );

const ROLE_FOCUS_ORDER = [
  'frontend',
  'fullstack',
  'backend',
  'mobile',
] as const;

const classifyRoleFocus = (
  title: string,
  haystack: string,
  technologies: string[],
): JobClassification['roleFocus'] => {
  const roleFocus: JobClassification['roleFocus'] = [];
  if (matchesAny(VOCABULARY.cloudOpsTitle, title)) {
    roleFocus.push(PLATFORM_ROLE_FOCUS);
  }
  if (
    matchesAny(VOCABULARY.annotationTitle, title) ||
    matchesAny(VOCABULARY.annotationText, haystack)
  ) {
    roleFocus.push(DATA_ANNOTATION_ROLE_FOCUS);
  }
  if (matchesAny(VOCABULARY.productTitle, title)) {
    roleFocus.push(PRODUCT_ROLE_FOCUS);
  }
  const disciplines = ROLE_FOCUS_ORDER.filter((focus) =>
    matchesAny(VOCABULARY.roleFocus[focus], haystack),
  );
  roleFocus.push(...disciplines);
  if (
    disciplines.length > 0 ||
    matchesAny(VOCABULARY.softwareTitle, title) ||
    technologies.some((tech) => RELEVANT_TECHNOLOGY_NAMES.has(tech))
  ) {
    roleFocus.push(SOFTWARE_ROLE_FOCUS);
  }
  const onOtherTrack =
    roleFocus.includes(PLATFORM_ROLE_FOCUS) ||
    roleFocus.includes(DATA_ANNOTATION_ROLE_FOCUS) ||
    roleFocus.includes(PRODUCT_ROLE_FOCUS);
  if (
    !onOtherTrack &&
    (disciplines.length > 0 || matchesAny(VOCABULARY.softwareTitle, title)) &&
    meetsReactTrackThreshold(title, haystack)
  ) {
    roleFocus.push(REACT_ROLE_FOCUS);
  }
  return roleFocus;
};

const extractTechnologies = (
  input: ClassifyJobInput,
  haystack: string,
): string[] => {
  const found = new Set<string>(input.technologies ?? []);

  for (const entry of TECHNOLOGY_PATTERNS) {
    if (entry.pattern.test(haystack)) {
      found.add(entry.name);
    }
  }

  // Prefer React Native over bare React when both match RN text.
  if (found.has('React Native')) {
    // keep React if explicitly present beyond RN; pattern already excludes RN for React
  }

  return [...found];
};

const isUnrelatedStack = (
  roleFocus: JobClassification['roleFocus'],
  technologies: string[],
  haystack: string,
): boolean => {
  // Platform, annotation, and product roles are on their own tracks: the
  // languages a platform role deploys, an annotator reviews, or a product
  // manager's teams write say nothing about whether the job belongs here.
  if (
    roleFocus.includes(PLATFORM_ROLE_FOCUS) ||
    roleFocus.includes(DATA_ANNOTATION_ROLE_FOCUS) ||
    roleFocus.includes(PRODUCT_ROLE_FOCUS)
  ) {
    return false;
  }

  const hasRelevantTech = technologies.some((tech) =>
    RELEVANT_TECHNOLOGY_NAMES.has(tech),
  );
  if (hasRelevantTech) {
    return false;
  }

  return UNRELATED_STACK_PATTERNS.some((pattern) => pattern.test(haystack));
};

/** Any of these means the title's non-tech word describes the domain, not the job. */
const TECH_SIGNAL_ROLE_FOCUS = [
  SOFTWARE_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  DATA_ANNOTATION_ROLE_FOCUS,
] as const;

const isUnrelatedRole = (
  title: string,
  roleFocus: JobClassification['roleFocus'],
): boolean =>
  matchesAny(VOCABULARY.unrelatedRoleTitle, title) ||
  (matchesAny(VOCABULARY.nonTechTitle, title) &&
    !matchesAny(VOCABULARY.techTermTitle, title) &&
    !TECH_SIGNAL_ROLE_FOCUS.some((focus) => roleFocus.includes(focus)));

export const shouldPersistClassifiedJob = (
  classification: JobClassification,
): boolean =>
  !classification.isUnrelatedRole && !classification.isUnrelatedStack;

export const classifyJob = (input: ClassifyJobInput): JobClassification => {
  const title = foldText(input.title);
  const haystack = foldText(buildHaystack(input));
  const technologies = extractTechnologies(input, haystack);
  const roleFocus = classifyRoleFocus(title, haystack, technologies);

  return {
    technologies,
    seniority: classifySeniority(title, haystack),
    remotePolicy: classifyRemotePolicy(input),
    geography: classifyGeography(haystack),
    roleFocus,
    isUnrelatedStack: isUnrelatedStack(roleFocus, technologies, haystack),
    isUnrelatedRole: isUnrelatedRole(title, roleFocus),
    requiresRelocation: matchesAny(VOCABULARY.relocation, haystack),
  };
};
