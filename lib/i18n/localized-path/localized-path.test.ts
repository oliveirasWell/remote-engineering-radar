import {
  localeFromPath,
  localizedPath,
  unlocalizedPath,
} from './localized-path';

const PORTUGUESE = 'pt-BR';
const ENGLISH = 'en';

describe('localizedPath', () => {
  it.each([
    ['/', '/pt-BR'],
    ['/jobs', '/pt-BR/jobs'],
    ['/jobs/abc', '/pt-BR/jobs/abc'],
    ['/?country=brazil', '/pt-BR?country=brazil'],
    [
      '/jobs?focus=product&country=brazil',
      '/pt-BR/jobs?focus=product&country=brazil',
    ],
  ])('prefixes %s for Portuguese as %s', (path, expected) => {
    expect(localizedPath(PORTUGUESE, path)).toBe(expected);
  });

  it('leaves English paths unprefixed', () => {
    expect(localizedPath(ENGLISH, '/jobs?country=brazil')).toBe(
      '/jobs?country=brazil',
    );
  });
});

describe('unlocalizedPath', () => {
  it.each([
    ['/pt-BR', '/'],
    ['/pt-BR/jobs', '/jobs'],
    ['/jobs', '/jobs'],
    ['/', '/'],
    ['/pt-BRX', '/pt-BRX'],
  ])('reads %s as the shared path %s', (path, expected) => {
    expect(unlocalizedPath(path)).toBe(expected);
  });
});

describe('localeFromPath', () => {
  it.each([
    ['/pt-BR', PORTUGUESE],
    ['/pt-BR/jobs', PORTUGUESE],
    ['/jobs', ENGLISH],
    ['/', ENGLISH],
  ])('reads %s as %s', (path, locale) => {
    expect(localeFromPath(path)).toBe(locale);
  });
});
