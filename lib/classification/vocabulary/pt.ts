import type { ClassificationVocabulary } from './types';

/**
 * "Modelo de trabalho: híbrido", "regime remoto". Not a bare "trabalho":
 * benefit blurbs say "cultura de trabalho híbrido" on remote jobs.
 */
const WORK_MODEL = String.raw`\b(?:modelo|regime)(?:\s+de\s+trabalho)?\s*:?\s*["“”']?`;

export const PT_VOCABULARY: ClassificationVocabulary = {
  remote: {
    title: {
      remote: [/\bremot[oa]\b/i, /\bhome[\s-]?office\b/i],
      hybrid: [/\bhibrid[oa]\b/i],
      onsite: [/\bpresencial\b/i],
    },
    body: {
      remote: [
        /\b100\s*%\s*remot[oa]\b/i,
        new RegExp(`${WORK_MODEL}remot[oa]\\b`, 'i'),
        /\bvaga\s+remota\b/i,
      ],
      hybrid: [new RegExp(`${WORK_MODEL}hibrid[oa]\\b`, 'i')],
      onsite: [
        new RegExp(`${WORK_MODEL}presencial\\b`, 'i'),
        /\brotina\s+presencial\b/i,
      ],
    },
    benefitNoise: [
      /\bauxilio\s+home[\s-]?office\b(?:\s*\([^)]*\))?/i,
      /\btrabalhar\s+remotamente\s+de\s+qualquer\s+lugar\b[^.]{0,60}\bate\b/i,
    ],
  },
  seniority: {
    junior: [],
    mid: [],
    principal: [],
    staff: [],
    senior: [],
  },
  // "Pleno domínio" and "estágio do negócio" are ordinary phrases in a body.
  seniorityTitle: {
    junior: [/\bestagi(?:o|ari[oa])\b/i],
    mid: [/\bpleno\b/i],
    principal: [],
    staff: [],
    senior: [],
  },
  roleFocus: {
    frontend: [],
    fullstack: [],
    backend: [],
    mobile: [],
  },
  cloudOpsTitle: [
    /\bengenheir[oa]\s+de\s+(?:plataforma|infraestrutura|confiabilidade)\b/i,
  ],
  annotationTitle: [
    /\banotador(?:a|es|\(a\))?(?=\W|$)/i,
    /\btreinador(?:a|\(a\))?\s+de\s+ia\b/i,
    /\brotulador(?:a|\(a\))?(?=\W|$)/i,
  ],
  annotationText: [/\banotacao\s+de\s+dados\b/i, /\brotulagem\s+de\s+dados\b/i],
  // Never a bare "PO": SAP titles use it for Process Orchestration.
  productTitle: [
    /\b(?:gerente|coordenador(?:a|\(a\))?|diretor(?:a|\(a\))?|head|lider)\s+de\s+produtos?\b/i,
    /\bgestao\s+de\s+produtos?\b/i,
    /\bdono\s+do\s+produto\b/i,
  ],
  softwareTitle: [
    /\bdesenvolvedor(?:a|\(a\))?(?=\W|$)/i,
    /\bprogramador(?:a|\(a\))?(?=\W|$)/i,
    /\bengenheir[oa]\s+de\s+software\b/i,
    /\blider\s+tecnic[oa]\b/i,
  ],
  unrelatedRoleTitle: [
    /\brepresentante\s+comercial\b/i,
    /\bvendedor(?:a|\(a\))?(?=\W|$)/i,
    /\bconsultor(?:a|\(a\))?\s+comercial\b/i,
    /\bexecutiv[oa](?:\(a\))?\s+de\s+(?:vendas|contas)\b/i,
    /\brecrutador(?:a|\(a\))?(?=\W|$)/i,
    /\bsucesso\s+do\s+cliente\b/i,
  ],
  relocation: [/\b(?:realocacao|relocacao)\b/i],
  geography: {
    brazil: [/\bbrasil\b/i, /\bsao paulo\b/i],
    latam: [
      /\bamerica\s+latina\b/i,
      /\blatinoamerica\b/i,
      /\bamerica\s+do\s+sul\b/i,
    ],
    americas: [],
    worldwide: [],
  },
};
