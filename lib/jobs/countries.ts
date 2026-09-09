import type { JobGeography } from '@/lib/classification/types';

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
  worldwide: 'worldwide',
  global: 'worldwide',
};

export const normalizeCountryName = (value: string): string | undefined => {
  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  if (!key || key === 'remote') {
    return undefined;
  }

  const alias = COUNTRY_ALIASES[key];
  if (alias) {
    return alias;
  }

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
    return key;
  }

  return key.replace(/\s+/g, '-');
};

export const resolveJobCountries = (input: {
  sourceCountries?: string[];
  location?: string;
  geographies: JobGeography[];
}): string[] => {
  const countries = new Set<string>();

  for (const raw of input.sourceCountries ?? []) {
    const normalized = normalizeCountryName(raw);
    if (normalized) {
      countries.add(normalized);
    }
  }

  if (input.location) {
    for (const part of input.location.split(/[,|/]|\s*-\s*/)) {
      const normalized = normalizeCountryName(part);
      if (normalized) {
        countries.add(normalized);
      }
    }
  }

  if (input.geographies.includes('brazil')) {
    countries.add('brazil');
  }
  if (input.geographies.includes('worldwide')) {
    countries.add('worldwide');
  }
  if (input.geographies.includes('americas')) {
    countries.add('united-states');
    countries.add('canada');
  }

  return [...countries];
};
