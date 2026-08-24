import { CITY_RESULTS_TEXT } from '../../app/components/Search/CityResults/constants';
import { SEARCH_TEXT } from '../../app/components/Search/constants';
import { WEATHER_BODY_TEXT } from '../../app/components/WeatherBody/constants';
import { WEATHER_DISPLAY_TEXT } from '../../app/components/WeatherBody/WeatherDisplay/constants';
import { DISCLAIMER_TEXT } from '../../components/Disclaimer/constants';
import {
  CHICAGO_CITY,
  CHICAGO_FORECAST,
  CHICAGO_WEATHER,
} from '../fixtures/domain/chicagoWeather';

export const HOME_PATH = '/';
export const CITY_QUERY = CHICAGO_CITY.name.toLowerCase();
export const CITY_RESULT_LABEL = `${CHICAGO_CITY.name}, ${CHICAGO_CITY.state}, ${CHICAGO_CITY.country}`;
export const NO_RESULTS_QUERY = 'asdfgh';
export const SEARCH_INPUT_SELECTOR = `input[placeholder="${SEARCH_TEXT.placeholder}"]`;
export const WEATHER_ICON_SELECTOR = '[data-cy="weather-icon"]';
export const FORECAST_UNIT_SUFFIXES = ['°C', '°F'] as const;

export {
  WEATHER_BODY_TEXT,
  CHICAGO_CITY,
  CHICAGO_FORECAST,
  CHICAGO_WEATHER,
  CITY_RESULTS_TEXT,
  DISCLAIMER_TEXT,
  SEARCH_TEXT,
  WEATHER_DISPLAY_TEXT,
};
