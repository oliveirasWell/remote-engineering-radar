// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { messagesFor } from '@/lib/i18n/messages';
import { AdUnit } from './AdUnit';

const ADSENSE_TEST = vi.hoisted(() => ({
  client: 'ca-pub-1234567890123456',
  slot: '1234567890',
}));

vi.mock('@/lib/marketing/adsense', () => ({
  ADSENSE_CLIENT_ID: ADSENSE_TEST.client,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AdUnit', () => {
  it('initializes a compact, labeled top bar ad', () => {
    const push = vi.fn();
    vi.stubGlobal('adsbygoogle', { push });

    render(<AdUnit placement="topbar" slot={ADSENSE_TEST.slot} />);

    const region = screen.getByRole('complementary', {
      name: messagesFor().marketing.advertisement,
    });
    const ad = region.querySelector('ins.adsbygoogle');
    expect(region).toHaveClass('border-b');
    expect(ad).toHaveAttribute('data-ad-client', ADSENSE_TEST.client);
    expect(ad).toHaveAttribute('data-ad-slot', ADSENSE_TEST.slot);
    expect(ad).toHaveStyle({ height: '50px' });
    expect(push).toHaveBeenCalledExactlyOnceWith({});
  });

  it('initializes a responsive home ad with a localized label', () => {
    const push = vi.fn();
    vi.stubGlobal('adsbygoogle', { push });

    render(
      <I18nProvider locale="pt-BR">
        <AdUnit placement="home" slot={ADSENSE_TEST.slot} />
      </I18nProvider>,
    );

    const region = screen.getByRole('complementary', {
      name: messagesFor('pt-BR').marketing.advertisement,
    });
    expect(region.querySelector('ins.adsbygoogle')).toHaveAttribute(
      'data-ad-format',
      'auto',
    );
    expect(push).toHaveBeenCalledExactlyOnceWith({});
  });

  it('does not render or request ads while the slot is unconfigured', () => {
    const push = vi.fn();
    vi.stubGlobal('adsbygoogle', { push });

    const { container } = render(<AdUnit placement="topbar" slot="" />);

    expect(container).toBeEmptyDOMElement();
    expect(push).not.toHaveBeenCalled();
  });

  it('does not request the same ad twice under StrictMode', () => {
    const push = vi.fn();
    vi.stubGlobal('adsbygoogle', { push });

    render(
      <StrictMode>
        <AdUnit placement="topbar" slot={ADSENSE_TEST.slot} />
      </StrictMode>,
    );

    expect(push).toHaveBeenCalledExactlyOnceWith({});
  });
});
