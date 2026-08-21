import { buildForecastUrl } from '../../lib/weather/client/buildForecastUrl';
import { buildGeocodeUrl } from '../../lib/weather/client/buildGeocodeUrl';
import { buildCurrentWeatherUrl } from '../../lib/weather/client/buildCurrentWeatherUrl';
import {
  CHICAGO_CITY,
  CHICAGO_FORECAST,
  CHICAGO_WEATHER,
  CITY_QUERY,
  NO_RESULTS_QUERY,
} from './scenarios';

export const interceptWeatherApi = () => {
  cy.intercept('GET', buildGeocodeUrl(CITY_QUERY), {
    body: [CHICAGO_CITY],
  }).as('geocode');
  cy.intercept(
    'GET',
    buildCurrentWeatherUrl(CHICAGO_CITY.lat, CHICAGO_CITY.lon),
    { body: CHICAGO_WEATHER },
  ).as('weather');
  cy.intercept(
    'GET',
    buildForecastUrl(CHICAGO_CITY.lat, CHICAGO_CITY.lon),
    { body: CHICAGO_FORECAST },
  ).as('forecast');
};

export const interceptEmptyGeocode = () => {
  cy.intercept('GET', buildGeocodeUrl(NO_RESULTS_QUERY), { body: [] }).as(
    'emptyGeocode',
  );
};
