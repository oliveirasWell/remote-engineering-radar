'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { ADSENSE_CLIENT_ID } from '@/lib/marketing/adsense';

export const AdUnit = ({
  placement,
  slot,
  preview = false,
}: {
  placement: 'topbar' | 'home';
  slot: string;
  preview?: boolean;
}) => {
  const { messages } = useI18n();
  const initialized = useRef(false);
  const configured = Boolean(ADSENSE_CLIENT_ID && slot);

  useEffect(() => {
    if (ADSENSE_CLIENT_ID && slot && !initialized.current) {
      initialized.current = true;
      const ads = window as Window & { adsbygoogle?: object[] };
      ads.adsbygoogle ??= [];
      ads.adsbygoogle.push({});
    }
  }, [slot]);

  if (!configured && !preview) {
    return null;
  }

  const responsiveAd = (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );

  return placement === 'topbar' ? (
    <aside
      aria-label={messages.marketing.advertisement}
      className="w-full border-b border-border bg-muted/30"
    >
      {configured ? (
        responsiveAd
      ) : (
        <div className="mx-auto flex h-[50px] w-full max-w-[468px] items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
          {messages.marketing.preview}
        </div>
      )}
    </aside>
  ) : (
    <aside aria-label={messages.marketing.advertisement} className="w-full">
      <span className="mb-2 block text-center text-xs text-muted-foreground">
        {messages.marketing.advertisement}
      </span>
      {configured ? (
        responsiveAd
      ) : (
        <div className="flex min-h-[120px] items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
          {messages.marketing.preview}
        </div>
      )}
    </aside>
  );
};
