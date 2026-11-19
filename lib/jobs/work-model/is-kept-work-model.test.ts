import { isKeptWorkModel } from './is-kept-work-model';

describe('isKeptWorkModel', () => {
  it.each([
    { remotePolicy: 'remote', countries: [], kept: true },
    { remotePolicy: 'hybrid', countries: ['brazil'], kept: true },
    { remotePolicy: 'onsite', countries: ['brazil', 'chile'], kept: true },
    { remotePolicy: 'hybrid', countries: ['germany'], kept: false },
    { remotePolicy: 'onsite', countries: [], kept: false },
    { remotePolicy: null, countries: ['brazil'], kept: false },
  ])(
    '$remotePolicy in $countries is kept: $kept',
    ({ remotePolicy, countries, kept }) => {
      expect(isKeptWorkModel(remotePolicy, countries)).toBe(kept);
    },
  );
});
