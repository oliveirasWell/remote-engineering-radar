import type { NormalizedJob } from '../types';
import { RELEVANT_TECHNOLOGY_NAMES } from '../../classification/constants';
import { FRONTENDBR_SOURCE_NAME } from './constants';

export type FrontendBrIssue = {
  number?: unknown;
  title?: unknown;
  html_url?: unknown;
  created_at?: unknown;
  labels?: unknown;
  body?: unknown;
  pull_request?: unknown;
};

/**
 * Both scales are ordered least to most. When an issue carries conflicting
 * labels the highest-ranked one wins, so `Estágio` + `Sênior` reads as senior.
 * Modality explicitly stated in the title is handled separately.
 */
type ClassificationRule = {
  value: string;
  labels: readonly string[];
};

const SENIORITY_RULES = [
  { value: 'junior', labels: ['estágio', 'júnior'] },
  { value: 'mid', labels: ['pleno'] },
  { value: 'senior', labels: ['sênior'] },
  { value: 'staff', labels: ['especialista'] },
] as const satisfies readonly ClassificationRule[];

const REMOTE_POLICY_RULES = [
  {
    value: 'onsite',
    labels: ['alocado'],
    locationPattern: /\b(alocado|onsite|on-site|presencial)\b/,
    locationPriority: 2,
  },
  {
    value: 'hybrid',
    labels: ['híbrido'],
    locationPattern: /\b(hibrido|hybrid)\b/,
    locationPriority: 0,
  },
  {
    value: 'remote',
    labels: ['remoto'],
    locationPattern: /\b(remoto|remote)\b/,
    locationPriority: 1,
  },
] as const satisfies readonly (ClassificationRule & {
  locationPattern: RegExp;
  locationPriority: number;
})[];

const REMOTE_POLICY_LOCATION_RULES = [...REMOTE_POLICY_RULES].sort(
  (left, right) => left.locationPriority - right.locationPriority,
);

const COMPANY_SEPARATORS = [' na ', ' at ', ' - '];
const TECHNOLOGY_NAMES = new Set(
  [...RELEVANT_TECHNOLOGY_NAMES].map((name) => name.toLowerCase()),
);

const hasBalancedParentheses = (value: string): boolean => {
  let depth = 0;

  for (const character of value) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readLabelNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((label) =>
      typeof label === 'string'
        ? label
        : asString((label as { name?: unknown })?.name),
    )
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase());
};

const highestRanked = (
  labelNames: string[],
  rules: readonly ClassificationRule[],
): string | undefined => {
  const names = new Set(labelNames);
  let best: string | undefined;

  for (const rule of rules) {
    if (rule.labels.some((label) => names.has(label))) {
      best = rule.value;
    }
  }

  return best;
};

const readRemotePolicyFromLocation = (
  location: string | undefined,
): string | undefined => {
  const normalized = location
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return REMOTE_POLICY_LOCATION_RULES.find((rule) =>
    rule.locationPattern.test(normalized),
  )?.value;
};

/**
 * frontendbr/vagas titles follow `[Local] Cargo na EMPRESA`, but posts drift to
 * `Cargo - EMPRESA` and `Cargo (EMPRESA)`. Titles naming no company at all are
 * skipped rather than guessed, so deduplication never invents a company.
 */
const splitTitle = (
  rawTitle: string,
): { location?: string; title: string; company: string } | null => {
  const bracket = rawTitle.match(/^\s*\[([^\]]*)\]\s*/);
  const location = bracket ? asString(bracket[1]) : undefined;
  const remainder = bracket
    ? rawTitle.slice(bracket[0].length).trim()
    : rawTitle.trim();

  for (const separator of COMPANY_SEPARATORS) {
    const index = remainder.toLowerCase().lastIndexOf(separator);
    if (index > 0) {
      const title = asString(remainder.slice(0, index));
      const company = asString(remainder.slice(index + separator.length));
      if (title && company) {
        return { location, title, company };
      }
    }
  }

  const parentheticalThenCompany = remainder.match(
    /^(.+\([^()]+\))\s+([^()]+)$/,
  );
  const parentheticalTitle = asString(parentheticalThenCompany?.[1]);
  const suffixCompany = asString(parentheticalThenCompany?.[2]);
  if (
    parentheticalTitle &&
    suffixCompany &&
    hasBalancedParentheses(parentheticalTitle) &&
    !TECHNOLOGY_NAMES.has(suffixCompany.toLowerCase())
  ) {
    return { location, title: parentheticalTitle, company: suffixCompany };
  }

  const trailingParenthesis = remainder.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  const title = asString(trailingParenthesis?.[1]);
  const company = asString(trailingParenthesis?.[2]);
  if (title && company && !TECHNOLOGY_NAMES.has(company.toLowerCase())) {
    return { location, title, company };
  }

  return null;
};

const readPostedAt = (value: unknown): Date | undefined => {
  const raw = asString(value);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const normalizeFrontendBrIssue = (
  issue: FrontendBrIssue,
): NormalizedJob | null => {
  if (issue.pull_request) {
    return null;
  }

  const sourceJobId =
    typeof issue.number === 'number' && Number.isFinite(issue.number)
      ? String(issue.number)
      : undefined;
  const rawTitle = asString(issue.title);
  const url = asString(issue.html_url);
  if (!sourceJobId || !rawTitle || !url) {
    return null;
  }

  const parts = splitTitle(rawTitle);
  if (!parts) {
    return null;
  }

  const labelNames = readLabelNames(issue.labels);

  return {
    source: FRONTENDBR_SOURCE_NAME,
    sourceJobId,
    company: {
      name: parts.company,
    },
    title: parts.title,
    url,
    location: parts.location,
    remotePolicy:
      readRemotePolicyFromLocation(parts.location) ??
      highestRanked(labelNames, REMOTE_POLICY_RULES),
    description: asString(issue.body),
    technologies: [],
    seniority: highestRanked(labelNames, SENIORITY_RULES),
    postedAt: readPostedAt(issue.created_at),
  };
};
