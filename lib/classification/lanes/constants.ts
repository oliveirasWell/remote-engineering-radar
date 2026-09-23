import { TECHNOLOGY_PATTERNS } from '../constants';

/**
 * React the library, in a title: a poster who writes "React" there has chosen
 * the stack. "React Native" is deliberately included — it is still React.
 */
export const REACT_TITLE_ANCHORS = [/\breact\b/i] as const;

/**
 * React the library, in a body. A bare "react" is the English verb, and
 * "work with React engineers" describes the neighbours, not the job.
 */
export const REACT_BODY_ANCHORS = [
  /\breact\s*\.?js\b/i,
  /\breact\s*native\b/i,
  /\breact\s*[+/,]/i,
  /\breact\s+and\b/i,
  /\b(?:with|in|using)\s+react\b(?!\s+(?:engineers?|developers?|devs?|teams?))/i,
  /\breact\s+(?:application|applications|app|apps|component|components|codebase|ecosystem|hooks|stack)\b/i,
] as const;

export const REACT_SUPPORT_TERMS = [
  /\breact\s*native\b/i,
  /\bjest\b/i,
  /\bmaterial[\s-]?ui\b|\bmui\b/i,
  /\btailwind\b/i,
  /\btypescript\b/i,
  /\bnext\s*\.?js\b/i,
  /\breact testing library\b|\b@testing-library\/react\b/i,
  /\bredux\b|\breact query\b|\btanstack query\b/i,
] as const;

export const REACT_SUPPORT_MINIMUM = 3;

/** A competing stack in the title outranks anything the body lists. */
export const REACT_TITLE_VETOES = [
  /\bangular\b/i,
  /\bvue\s*\.?js\b|\bvue\b/i,
  /\b\.net\b/i,
  /\bjava\b(?!script)/i,
  /\bdata\s+engineer(?:ing)?\b/i,
] as const;

/** The cloud half of the shared technology vocabulary, reused verbatim. */
export const CLOUD_SUPPORT_TERMS = TECHNOLOGY_PATTERNS.filter(
  (entry) => entry.kind === 'cloud',
).map((entry) => entry.pattern);

export const CLOUD_SUPPORT_MINIMUM = 2;

/**
 * React Native and Flutter are absent on purpose: a cross-platform framework
 * says what the job is built with, not that the job targets a phone.
 */
export const MOBILE_TERMS = [/\bios\b/i, /\bandroid\b/i] as const;
