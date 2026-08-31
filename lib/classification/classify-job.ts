import {
  RELEVANT_TECHNOLOGY_NAMES,
  TECHNOLOGY_PATTERNS,
  UNRELATED_ROLE_PATTERNS,
  UNRELATED_STACK_PATTERNS,
} from './constants';
import type { JobClassification } from './types';

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

const classifySeniority = (
  haystack: string,
): JobClassification['seniority'] => {
  if (/\b(intern|internship|entry[-\s]?level|junior)\b/i.test(haystack)) {
    return 'junior';
  }
  if (/\bmid[-\s]?level\b|\bmid\b(?=[\s,-])/i.test(haystack)) {
    return 'mid';
  }
  if (/\bprincipal\b/i.test(haystack)) {
    return 'principal';
  }
  if (/\bstaff\b/i.test(haystack)) {
    return 'staff';
  }
  if (/\bsenior\b|\bsr\.?\b/i.test(haystack)) {
    return 'senior';
  }
  return undefined;
};

const classifyRemotePolicy = (
  input: ClassifyJobInput,
  haystack: string,
): JobClassification['remotePolicy'] => {
  const explicit = input.remotePolicy?.toLowerCase();
  if (explicit === 'remote' || explicit === 'hybrid' || explicit === 'onsite') {
    return explicit;
  }

  if (/\bremote\b/i.test(haystack)) {
    return 'remote';
  }
  if (/\bhybrid\b/i.test(haystack)) {
    return 'hybrid';
  }
  if (/\bonsite\b|\bon-site\b|\bin[-\s]?office\b/i.test(haystack)) {
    return 'onsite';
  }
  return undefined;
};

const classifyGeography = (
  haystack: string,
): JobClassification['geography'] => {
  const geography: JobClassification['geography'] = [];
  if (
    /\bbrazil\b|\bbrasil\b|\blatam\b.*brazil|\bs[ãa]o paulo\b/i.test(haystack)
  ) {
    geography.push('brazil');
  }
  if (/\blatam\b|\blatin america\b|\bsouth america\b/i.test(haystack)) {
    geography.push('latam');
  }
  if (
    /\bamericas\b|\bnorth america\b|\bunited states\b|\busa\b|\bcanada\b/i.test(
      haystack,
    )
  ) {
    geography.push('americas');
  }
  if (/\bworldwide\b|\banywhere\b|\bglobal remote\b/i.test(haystack)) {
    geography.push('worldwide');
  }
  return geography;
};

const classifyRoleFocus = (
  haystack: string,
): JobClassification['roleFocus'] => {
  const roleFocus: JobClassification['roleFocus'] = [];
  if (/\bfront[-\s]?end\b|\bfrontend\b/i.test(haystack)) {
    roleFocus.push('frontend');
  }
  if (/\bfull[-\s]?stack\b|\bfullstack\b/i.test(haystack)) {
    roleFocus.push('fullstack');
  }
  if (/\bback[-\s]?end\b|\bbackend\b/i.test(haystack)) {
    roleFocus.push('backend');
  }
  if (/\bmobile\b|\breact native\b/i.test(haystack)) {
    roleFocus.push('mobile');
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
  technologies: string[],
  haystack: string,
): boolean => {
  const hasRelevantTech = technologies.some((tech) =>
    RELEVANT_TECHNOLOGY_NAMES.has(tech),
  );
  if (hasRelevantTech) {
    return false;
  }

  return UNRELATED_STACK_PATTERNS.some((pattern) => pattern.test(haystack));
};

const isUnrelatedRole = (title: string): boolean =>
  UNRELATED_ROLE_PATTERNS.some((pattern) => pattern.test(title));

export const shouldPersistClassifiedJob = (
  classification: JobClassification,
): boolean =>
  !classification.isUnrelatedRole && !classification.isUnrelatedStack;

export const classifyJob = (input: ClassifyJobInput): JobClassification => {
  const haystack = buildHaystack(input);
  const technologies = extractTechnologies(input, haystack);

  return {
    technologies,
    seniority: classifySeniority(haystack),
    remotePolicy: classifyRemotePolicy(input, haystack),
    geography: classifyGeography(haystack),
    roleFocus: classifyRoleFocus(haystack),
    isUnrelatedStack: isUnrelatedStack(technologies, haystack),
    isUnrelatedRole: isUnrelatedRole(input.title),
    requiresRelocation: /\brelocati(on|e)\b/i.test(haystack),
  };
};
