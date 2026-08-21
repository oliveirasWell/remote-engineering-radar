import { APP_TEXT } from '../../app/constants';
import { CITY_RESULTS_TEXT } from '../../components/weather/CityResults/constants';
import { DISCLAIMER_TEXT } from '../../components/weather/Disclaimer/constants';
import { SEARCH_PANEL_TEXT } from '../../components/weather/SearchPanel/constants';
import { WEATHER_DISPLAY_TEXT } from '../../components/weather/WeatherDisplay/constants';
import {
  CHICAGO_CITY,
  CHICAGO_FORECAST,
  CHICAGO_WEATHER,
} from '../fixtures/domain/chicagoWeather';

export const HOME_PATH = '/';
export const CITY_QUERY = CHICAGO_CITY.name;
export const CITY_RESULT_LABEL = `${CHICAGO_CITY.name}, ${CHICAGO_CITY.state}, ${CHICAGO_CITY.country}`;
export const NO_RESULTS_QUERY = 'asdfgh';
export const SEARCH_INPUT_SELECTOR = `input[placeholder="${SEARCH_PANEL_TEXT.placeholder}"]`;
export const WEATHER_ICON_SELECTOR = '[data-cy="weather-icon"]';
export const FORECAST_UNIT_SUFFIXES = ['°C', '°F'] as const;

export {
  APP_TEXT,
  CHICAGO_CITY,
  CHICAGO_FORECAST,
  CHICAGO_WEATHER,
  CITY_RESULTS_TEXT,
  DISCLAIMER_TEXT,
  SEARCH_PANEL_TEXT,
  WEATHER_DISPLAY_TEXT,
};
