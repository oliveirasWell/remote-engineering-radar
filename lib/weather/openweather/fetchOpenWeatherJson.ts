import 'server-only';

import { WeatherProviderError } from './WeatherProviderError';

export const fetchOpenWeatherJson = async (
  url: string,
  revalidateSeconds: number,
  emptyStatuses: readonly number[] = [],
): Promise<unknown> => {
  const response = await fetch(url, {
    next: { revalidate: revalidateSeconds },
  });

  if (emptyStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok) {
    throw new WeatherProviderError(response.status);
  }

  return response.json();
};
