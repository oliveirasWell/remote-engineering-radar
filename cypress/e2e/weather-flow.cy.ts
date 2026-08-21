import {
  APP_TEXT,
  CITY_QUERY,
  CITY_RESULT_LABEL,
  CITY_RESULTS_TEXT,
  CHICAGO_FORECAST,
  DISCLAIMER_TEXT,
  HOME_PATH,
  NO_RESULTS_QUERY,
  SEARCH_INPUT_SELECTOR,
  WEATHER_DISPLAY_TEXT,
  WEATHER_ICON_SELECTOR,
} from '../support/scenarios';
import { interceptEmptyGeocode, interceptWeatherApi } from '../support/weatherApi';

describe('weather flow', () => {
  beforeEach(() => {
    interceptWeatherApi();
  });

  it('shows the weather flow and disclaimers', () => {
    cy.visit(HOME_PATH);
    cy.get(SEARCH_INPUT_SELECTOR).type(CITY_QUERY);
    cy.contains(CITY_RESULT_LABEL).click();
    cy.contains(CITY_RESULT_LABEL).should('not.exist');

    cy.contains(APP_TEXT.weatherHeading).should('be.visible');
    cy.get(WEATHER_ICON_SELECTOR).should('be.visible');
    cy.contains(WEATHER_DISPLAY_TEXT.forecastHeading).should('be.visible');
    cy.contains(CITY_QUERY).should('be.visible');
    cy.contains(CHICAGO_FORECAST[0].label).should('be.visible');
    cy.contains(DISCLAIMER_TEXT.sidebar).should('be.visible');
    cy.contains(DISCLAIMER_TEXT.panel).should('be.visible');
  });

  it('shows no results for an empty geocode response', () => {
    interceptEmptyGeocode();
    cy.visit(HOME_PATH);
    cy.get(SEARCH_INPUT_SELECTOR).type(NO_RESULTS_QUERY);

    cy.contains(CITY_RESULTS_TEXT.noResults).should('be.visible');
  });
});
