import 'server-only';

import { WeatherProviderError } from './WeatherProviderError';

export const fetchOpenWeatherJson = async (
  url: string,
  fetchFn: typeof fetch,
  emptyStatuses: readonly number[] = [],
): Promise<unknown> => {
  const response = await fetchFn(url);

  if (emptyStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok) {
    throw new WeatherProviderError(response.status);
  }

  return response.json();
};
