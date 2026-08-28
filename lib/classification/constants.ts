export const TECHNOLOGY_PATTERNS = [
  { name: 'React Native', pattern: /\breact\s*native\b/i },
  { name: 'React', pattern: /\breact\b(?!\s*native)/i },
  { name: 'TypeScript', pattern: /\btypescript\b|\bts\b(?=[\s,./|]|$)/i },
  { name: 'Node.js', pattern: /\bnode\.?js\b|\bnodejs\b/i },
  { name: 'GraphQL', pattern: /\bgraphql\b/i },
  { name: 'Apollo', pattern: /\bapollo\b/i },
  { name: 'Jest', pattern: /\bjest\b/i },
  {
    name: 'React Testing Library',
    pattern: /\breact testing library\b|\b@testing-library\/react\b/i,
  },
  { name: 'Expo', pattern: /\bexpo\b/i },
] as const;

export const RELEVANT_TECHNOLOGY_NAMES: ReadonlySet<string> = new Set(
  TECHNOLOGY_PATTERNS.map((entry) => entry.name),
);

export const UNRELATED_STACK_PATTERNS = [
  /\bdevops\b/i,
  /\bsite reliability\b|\bsre\b/i,
  /\bdata engineer\b|\betl\b|\bspark\b|\bairflow\b/i,
  /\bqa engineer\b|\bquality assurance\b|\btest automation engineer\b/i,
  /\bandroid\b(?!.*(react native|expo))/i,
  /\bios\b(?!.*(react native|expo))/i,
  /\bswift\b|\bkotlin\b|\bjava\b(?!script)/i,
  /\bruby on rails\b|\b\.net\b|\bc#\b|\bgolang\b|\bgo engineer\b/i,
] as const;
