type Patterns = readonly RegExp[];

/**
 * Every language-dependent pattern the classifier reads, for one language.
 * Patterns run against accent-folded, lowercased text, so they are written
 * without accents.
 */
export type ClassificationVocabulary = {
  remote: {
    remote: Patterns;
    hybrid: Patterns;
    onsite: Patterns;
  };
  seniority: Record<
    'junior' | 'mid' | 'senior' | 'staff' | 'principal',
    Patterns
  >;
  roleFocus: Record<'frontend' | 'fullstack' | 'backend' | 'mobile', Patterns>;
  /** Matched against the title alone; see `en.ts` for why. */
  cloudOpsTitle: Patterns;
  annotationTitle: Patterns;
  annotationText: Patterns;
  productTitle: Patterns;
  unrelatedRoleTitle: Patterns;
  relocation: Patterns;
  geography: Record<'brazil' | 'latam' | 'americas' | 'worldwide', Patterns>;
};
