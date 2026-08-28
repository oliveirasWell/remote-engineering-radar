import { isSafeExternalUrl } from './external-url';

describe('isSafeExternalUrl', () => {
  it('accepts HTTPS URLs', () => {
    expect(isSafeExternalUrl('https://example.com/jobs/1')).toBe(true);
  });

  it('rejects executable, non-HTTPS, and malformed URLs', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(
      false,
    );
    expect(isSafeExternalUrl('http://example.com/jobs/1')).toBe(false);
    expect(isSafeExternalUrl('not a URL')).toBe(false);
  });
});
