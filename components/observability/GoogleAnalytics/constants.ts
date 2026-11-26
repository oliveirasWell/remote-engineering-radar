export const GA_SCRIPT_ID = 'ga-gtag';

export const gaMeasurementId = () =>
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || undefined;
