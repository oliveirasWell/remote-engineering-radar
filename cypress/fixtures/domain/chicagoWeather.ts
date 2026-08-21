export const CHICAGO_CITY = {
  id: '41.8755616,-87.6244212',
  name: 'Chicago',
  state: 'Illinois',
  country: 'US',
  lat: 41.8755616,
  lon: -87.6244212,
};

export const CHICAGO_WEATHER = {
  city: CHICAGO_CITY.name,
  temp: 18,
  condition: 'clear sky',
  iconCode: 800,
  isDay: false,
};

export const CHICAGO_FORECAST = [
  { date: '2026-08-21', label: 'Today', low: 18, high: 27, iconCode: 800, isPartial: false },
  { date: '2026-08-22', label: 'Saturday', low: 19, high: 28, iconCode: 801, isPartial: false },
  { date: '2026-08-23', label: 'Sunday', low: 20, high: 29, iconCode: 500, isPartial: false },
  { date: '2026-08-24', label: 'Monday', low: 17, high: 25, iconCode: 803, isPartial: false },
  { date: '2026-08-25', label: 'Tuesday', low: 16, high: 24, iconCode: 800, isPartial: false },
];
