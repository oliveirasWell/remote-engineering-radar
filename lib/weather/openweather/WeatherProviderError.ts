export class WeatherProviderError extends Error {
  constructor(public readonly status: number) {
    super('Weather provider request failed');
    this.name = 'WeatherProviderError';
  }
}
