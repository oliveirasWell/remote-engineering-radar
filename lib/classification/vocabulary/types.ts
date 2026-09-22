type Patterns = readonly RegExp[];

type RemotePolicy = 'remote' | 'hybrid' | 'onsite';

type Seniority = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

/**
 * Every language-dependent pattern the classifier reads, for one language.
 * Patterns run against accent-folded, lowercased text, so they are written
 * without accents.
 */
export type ClassificationVocabulary = {
  /**
   * Title and location name the work model; a description is only trusted
   * for explicit markers, after `benefitNoise` is removed, because Brazilian
   * postings list "auxílio home office" as a benefit on every contract type.
   */
  remote: {
    title: Record<RemotePolicy, Patterns>;
    body: Record<RemotePolicy, Patterns>;
    benefitNoise: Patterns;
  };
  /** Matched against the whole posting. */
  seniority: Record<Seniority, Patterns>;
  /**
   * Matched against the title alone, for words that are also ordinary
   * vocabulary: "pleno domínio", "estágio do negócio", "atividade principal".
   */
  seniorityTitle: Record<Seniority, Patterns>;
  roleFocus: Record<'frontend' | 'fullstack' | 'backend' | 'mobile', Patterns>;
  /** Matched against the title alone; see `en.ts` for why. */
  cloudOpsTitle: Patterns;
  annotationTitle: Patterns;
  annotationText: Patterns;
  productTitle: Patterns;
  /** A title that names a software job; see `SOFTWARE_ROLE_FOCUS`. */
  softwareTitle: Patterns;
  unrelatedRoleTitle: Patterns;
  /**
   * Titles that are obviously not tech. Unlike `unrelatedRoleTitle`, they
   * only reject a job with no software, product, platform, or annotation
   * signal, so "Clinical Software Engineer" stays.
   */
  nonTechTitle: Patterns;
  /**
   * Tech terms that keep a `nonTechTitle` job: "SAP Business Warehouse",
   * "Tutor de QA", "Teacher - AWS Solutions Architect".
   */
  techTermTitle: Patterns;
  relocation: Patterns;
  geography: Record<'brazil' | 'latam' | 'americas' | 'worldwide', Patterns>;
};
