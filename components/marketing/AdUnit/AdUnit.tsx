'use client';

import { useEffect, useRef, useState } from 'react';
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
  const adRef = useRef<HTMLModElement>(null);
  const [unfilled, setUnfilled] = useState(false);
  const configured = Boolean(ADSENSE_CLIENT_ID && slot);
  const empty = !configured || unfilled;

  useEffect(() => {
    const ad = adRef.current;
    if (!ad) {
      return;
    }
    const update = () => setUnfilled(ad.dataset.adStatus === 'unfilled');
    const observer = new MutationObserver(update);
    observer.observe(ad, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });
    queueMicrotask(update);
    return () => {
      observer.disconnect();
    };
  }, [slot]);

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
      ref={adRef}
      className="adsbygoogle data-[ad-status=unfilled]:hidden!"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
  const emptyBar = (
    <div className="flex h-6 w-full items-center justify-center bg-black text-xs text-white">
      {configured
        ? messages.marketing.advertisement
        : messages.marketing.preview}
    </div>
  );

  return placement === 'topbar' ? (
    <aside
      aria-label={messages.marketing.advertisement}
      className={`w-full border-b border-border ${empty ? 'bg-black' : 'bg-muted/30'}`}
    >
      {configured ? responsiveAd : null}
      {empty ? emptyBar : null}
    </aside>
  ) : (
    <aside aria-label={messages.marketing.advertisement} className="w-full">
      {empty ? null : (
        <span className="mb-2 block text-center text-xs text-muted-foreground">
          {messages.marketing.advertisement}
        </span>
      )}
      {configured ? responsiveAd : null}
      {empty ? emptyBar : null}
    </aside>
  );
};
