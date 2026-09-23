import { EN_VOCABULARY } from './en';
import { PT_VOCABULARY } from './pt';
import type { ClassificationVocabulary } from './types';

/** Adding a language is one vocabulary file and one entry here. */
const LANGUAGES: readonly ClassificationVocabulary[] = [
  EN_VOCABULARY,
  PT_VOCABULARY,
];

const merge = <K extends string>(
  pick: (vocabulary: ClassificationVocabulary) => Record<K, readonly RegExp[]>,
): Record<K, readonly RegExp[]> => {
  const entries = LANGUAGES.flatMap(
    (vocabulary) =>
      Object.entries(pick(vocabulary)) as [K, readonly RegExp[]][],
  );

  const grouped: [K, readonly RegExp[]][] = [
    ...new Set(entries.map(([key]) => key)),
  ].map((key) => [
    key,
    entries
      .filter(([entryKey]) => entryKey === key)
      .flatMap(([, patterns]) => patterns),
  ]);

  return Object.fromEntries(grouped) as Record<K, readonly RegExp[]>;
};

const concat = (
  pick: (vocabulary: ClassificationVocabulary) => readonly RegExp[],
): readonly RegExp[] => LANGUAGES.flatMap(pick);

/**
 * Every registered language merged per concept. No language detection: a
 * posting is matched against all of them.
 */
export const VOCABULARY: ClassificationVocabulary = {
  remote: {
    title: merge((vocabulary) => vocabulary.remote.title),
    body: merge((vocabulary) => vocabulary.remote.body),
    benefitNoise: concat((vocabulary) => vocabulary.remote.benefitNoise),
  },
  seniority: merge((vocabulary) => vocabulary.seniority),
  seniorityTitle: merge((vocabulary) => vocabulary.seniorityTitle),
  roleFocus: merge((vocabulary) => vocabulary.roleFocus),
  cloudOpsTitle: concat((vocabulary) => vocabulary.cloudOpsTitle),
  annotationTitle: concat((vocabulary) => vocabulary.annotationTitle),
  annotationText: concat((vocabulary) => vocabulary.annotationText),
  productTitle: concat((vocabulary) => vocabulary.productTitle),
  softwareTitle: concat((vocabulary) => vocabulary.softwareTitle),
  unrelatedRoleTitle: concat((vocabulary) => vocabulary.unrelatedRoleTitle),
  nonTechTitle: concat((vocabulary) => vocabulary.nonTechTitle),
  techTermTitle: concat((vocabulary) => vocabulary.techTermTitle),
  relocation: concat((vocabulary) => vocabulary.relocation),
  geography: merge((vocabulary) => vocabulary.geography),
};
