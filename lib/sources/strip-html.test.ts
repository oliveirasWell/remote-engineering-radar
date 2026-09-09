import { stripHtml } from './strip-html';

const STRIPPING_CASES = [
  {
    input: '<p>Senior <strong>React</strong> Engineer</p><p>Remote</p>',
    expected: 'Senior React Engineer Remote',
  },
  {
    input: '&lt;p&gt;Tom &amp; Jerry&#39;s &quot;team&quot;&lt;/p&gt;',
    expected: 'Tom & Jerry\'s "team"',
  },
  { input: '  Remote\n\tReact   role  ', expected: 'Remote React role' },
  { input: 'before <<broken> after', expected: 'before after' },
  { input: 'before <> after <b>role</b>', expected: 'before <> after role' },
  { input: 'before <unfinished', expected: 'before <unfinished' },
  { input: 'before > after <', expected: 'before > after <' },
  { input: '<br/>', expected: '' },
  { input: '', expected: '' },
] as const;
const ADVERSARIAL_LENGTH = 100_000;
const STRIPPING_BUDGET_MS = 500;

describe('stripHtml', () => {
  it.each(STRIPPING_CASES)(
    'strips $input to plain text',
    ({ input, expected }) => {
      expect(stripHtml(input)).toBe(expected);
    },
  );

  it('preserves repeated unclosed tag openings without quadratic work', () => {
    const input = '<'.repeat(ADVERSARIAL_LENGTH);
    const start = performance.now();
    const result = stripHtml(input);
    const elapsedMs = performance.now() - start;

    expect(result).toBe(input);
    expect(elapsedMs).toBeLessThan(STRIPPING_BUDGET_MS);
  });
});
