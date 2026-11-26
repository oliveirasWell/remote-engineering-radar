import Script from 'next/script';
import { GA_SCRIPT_ID, gaMeasurementId } from './constants';

/**
 * Loads GA4 only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Preview and local
 * runs stay out of the production property even if the id is present.
 */
export const GoogleAnalytics = () => {
  const measurementId = gaMeasurementId();
  if (!measurementId || process.env.VERCEL_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id={GA_SCRIPT_ID} strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
    </>
  );
};
