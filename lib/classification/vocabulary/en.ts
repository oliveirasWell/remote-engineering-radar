import type { ClassificationVocabulary } from './types';

export const EN_VOCABULARY: ClassificationVocabulary = {
  remote: {
    title: {
      remote: [/\bremote\b/i],
      hybrid: [/\bhybrid\b/i],
      onsite: [/\bonsite\b|\bon-site\b|\bin[-\s]?office\b/i],
    },
    // "#LI-Remote", "#LI-Hybrid", and "#LI-Onsite" tags match these too.
    body: {
      remote: [/\bremote\b/i],
      hybrid: [/\bhybrid\b/i],
      onsite: [/\bonsite\b|\bon-site\b|\bin[-\s]?office\b/i],
    },
    benefitNoise: [
      /\bhome[\s-]?office\s+(?:allowance|stipend)\b/i,
      /\bwork\s+from\s+anywhere\b[^.]{0,80}\b(?:days|weeks)\b/i,
    ],
  },
  seniority: {
    junior: [/\b(intern|internship|entry[-\s]?level|junior)\b/i],
    mid: [/\bmid[-\s]?level\b|\bmid\b(?=[\s,-])/i],
    principal: [],
    staff: [/\bstaff\b/i],
    senior: [/\bsenior\b|\bsr\.?\b/i],
  },
  seniorityTitle: {
    junior: [],
    mid: [],
    // Bodies say "principal responsibilities"; only a title names the level.
    principal: [/\bprincipal\b/i],
    staff: [],
    senior: [],
  },
  roleFocus: {
    frontend: [/\bfront[-\s]?end\b|\bfrontend\b/i],
    fullstack: [/\bfull[-\s]?stack\b|\bfullstack\b/i],
    backend: [/\bback[-\s]?end\b|\bbackend\b/i],
    mobile: [/\bmobile\b|\breact native\b/i],
  },
  /**
   * A body that mentions "infrastructure" or "cloud" describes a backend
   * job's environment; a title that says so names the discipline the job is
   * actually for.
   */
  cloudOpsTitle: [
    /\bdevops\b/i,
    /\bsite reliability\b|\bsre\b/i,
    /\bplatform\s+(?:engineer|engineering)\b/i,
    /\bcloud\s+(?:engineer|architect|infrastructure)\b/i,
    /\binfrastructure\s+engineer\b/i,
    /\bsystems?\s+engineer\b/i,
  ],
  annotationTitle: [
    /\bannotat(?:or|ors|ion)\b/i,
    /\bai\s+train(?:er|ing)\b/i,
    /\bdata\s+label(?:l)?(?:er|ing)\b/i,
    /\blabeler\b/i,
    /\brlhf\b/i,
    /\bai\s+(?:tutor|evaluator|content\s+reviewer)\b/i,
  ],
  /**
   * Only full phrases: a bare "annotate" or "RLHF" in a body shows up in
   * technical-writer and ML-research jobs too.
   */
  annotationText: [
    /\bdata\s+annotation\b/i,
    /\bai\s+training\s+data\b/i,
    /\btraining\s+and\s+evaluation\s+data\b/i,
    /\bai\s+trainer\b/i,
  ],
  /**
   * Engineering bodies routinely mention working with product managers. A
   * neighbouring discipline ("Product Lead Engineer", "Head of Product
   * Design") names a different job, and "Product Engineer" and "Product
   * Marketing" titles never match.
   */
  productTitle: [
    /\bproduct\s+(?:manager|owner|lead|director)\b(?!\s+(?:engineer|designer|developer)\b)/i,
    /\b(?:head|director|vp|vice\s+president)\s+of\s+product\b(?!\s+(?:engineering|design|designer|marketing|operations)\b)/i,
  ],
  softwareTitle: [
    /\bengineer(?:s|ing)?\b/i,
    /\bdeveloper\b/i,
    /\bsoftware\b/i,
    /\bprogrammer\b/i,
    /\btech(?:nical)?\s+lead\b/i,
    /\bfront[-\s]?end\b|\bback[-\s]?end\b|\bfull[-\s]?stack\b/i,
    /\bmobile\b|\bios\b|\bandroid\b/i,
    /\bweb\b/i,
    /\bcto\b/i,
  ],
  unrelatedRoleTitle: [
    /\bsales\s+representative\b/i,
    /\baccount\s+executive\b/i,
    /\b(?:sdr|bdr)\b/i,
    /\b(?:sales\s+development|business\s+development)\s+representative\b/i,
    /\bsales\s+(?:manager|director|engineer|associate|executive)\b/i,
    /\brecruiter\b|\btalent\s+acquisition\b|\bpeople\s+partner\b/i,
    /\bcustomer\s+success\b/i,
    /\baccount\s+manager\b/i,
    /\b(?:marketing\s+manager|growth\s+marketing|product\s+marketing|content\s+marketing)\b/i,
  ],
  nonTechTitle: [
    /\bnurs(?:e|es|ing)\b/i,
    /\b(?:rn|lpn|cna)\b/i,
    /\bphysician\b|\bpharmacist\b|\bdental\b|\btherapist\b/i,
    /\baccountant\b|\baccounting\s+(?:clerk|specialist|manager)\b|\bbookkeep(?:er|ing)\b/i,
    /\btax\s+(?:manager|preparer|associate|accountant|senior)\b/i,
    /\bparalegal\b|\battorney\b|\blawyer\b|\blegal\s+counsel\b/i,
    /\bteacher\b|\btutor\b/i,
    /\btranslator\b|\binterpreter\b/i,
    /\bcustomer\s+service\s+representative\b|\bcall\s+center\b/i,
    /\binsurance\s+agent\b|\bunderwriter\b|\breal\s+estate\s+agent\b/i,
    /\bdriver\b|\bwarehouse\b/i,
  ],
  techTermTitle: [
    /\b(?:ai|ml|llm|qa|sap|aws|azure|gcp|cloud|data|it|saas)\b/i,
    /\b(?:architect|security|analytics|automation|salesforce|informatics)\b/i,
    /\bcomputer\s+science\b|\bprogramming\b/i,
  ],
  relocation: [/\brelocati(on|e)\b/i],
  geography: {
    brazil: [/\bbrazil\b/i],
    latam: [/\blatam\b|\blatin america\b|\bsouth america\b/i],
    americas: [
      /\bamericas\b|\bnorth america\b|\bunited states\b|\busa\b|\bcanada\b/i,
    ],
    worldwide: [/\bworldwide\b|\banywhere\b|\bglobal remote\b/i],
  },
};
