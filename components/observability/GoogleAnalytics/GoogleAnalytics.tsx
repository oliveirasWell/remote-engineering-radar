import Script from 'next/script';
import { GA_MEASUREMENT_ID, GA_SCRIPT_ID } from './constants';

/**
 * The measurement id names one production property, so preview deployments and
 * local runs would report their own traffic as real. Only production loads it.
 */
export const GoogleAnalytics = () => {
  if (process.env.VERCEL_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id={GA_SCRIPT_ID} strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
};
