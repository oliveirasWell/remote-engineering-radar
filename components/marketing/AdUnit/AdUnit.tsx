'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { ADSENSE_CLIENT_ID } from '@/lib/marketing/adsense';

export const AdUnit = ({
  placement,
  slot,
}: {
  placement: 'topbar' | 'home';
  slot: string;
}) => {
  const { messages } = useI18n();
  const initialized = useRef(false);

  useEffect(() => {
    if (ADSENSE_CLIENT_ID && slot && !initialized.current) {
      initialized.current = true;
      const ads = window as Window & { adsbygoogle?: object[] };
      ads.adsbygoogle ??= [];
      ads.adsbygoogle.push({});
    }
  }, [slot]);

  if (!ADSENSE_CLIENT_ID || !slot) {
    return null;
  }

  return placement === 'topbar' ? (
    <aside
      aria-label={messages.marketing.advertisement}
      className="w-full border-b border-border bg-muted/30 px-4 py-1"
    >
      <ins
        className="adsbygoogle mx-auto"
        style={{ display: 'block', width: '100%', maxWidth: 468, height: 50 }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
      />
    </aside>
  ) : (
    <aside aria-label={messages.marketing.advertisement} className="w-full">
      <span className="mb-2 block text-center text-xs text-muted-foreground">
        {messages.marketing.advertisement}
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
