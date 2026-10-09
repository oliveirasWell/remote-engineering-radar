import { foldText } from '@/lib/text/fold-text/fold-text';

const COUNTRY_ALIASES: Readonly<Record<string, string>> = {
  brazil: 'brazil',
  brasil: 'brazil',
  br: 'brazil',
  chile: 'chile',
  cl: 'chile',
  argentina: 'argentina',
  ar: 'argentina',
  mexico: 'mexico',
  méxico: 'mexico',
  mx: 'mexico',
  colombia: 'colombia',
  co: 'colombia',
  peru: 'peru',
  uruguay: 'uruguay',
  paraguay: 'paraguay',
  'united states': 'united-states',
  usa: 'united-states',
  us: 'united-states',
  canada: 'canada',
  ukraine: 'ukraine',
  ua: 'ukraine',
  ukr: 'ukraine',
  ucrania: 'ukraine',
  india: 'india',
  in: 'india',
  ind: 'india',
  egypt: 'egypt',
  eg: 'egypt',
  egy: 'egypt',
  egito: 'egypt',
  pakistan: 'pakistan',
  pk: 'pakistan',
  pak: 'pakistan',
  paquistao: 'pakistan',
  latam: 'latam',
  'latin america': 'latam',
  'america latina': 'latam',
  worldwide: 'worldwide',
  global: 'worldwide',
  anywhere: 'worldwide',
};

export const normalizeCountryName = (value: string): string | undefined => {
  const key = foldText(value.trim());

  if (!key || key === 'remote') {
    return undefined;
  }

  if (Object.hasOwn(COUNTRY_ALIASES, key)) {
    return COUNTRY_ALIASES[key];
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)
    ? key
    : key.replaceAll(/\s+/g, '-');
};

export const resolveJobCountries = (input: {
  sourceCountries?: string[];
  location?: string;
}): string[] => {
  const candidates = [
    ...(input.sourceCountries ?? []),
    ...(input.location?.split(/[,|/]|\s*-\s*/) ?? []),
  ];

  return [
    ...new Set(
      candidates
        .map((candidate) => normalizeCountryName(candidate))
        .filter((country): country is string => Boolean(country)),
    ),
  ];
};
