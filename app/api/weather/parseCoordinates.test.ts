import { CHICAGO } from '@/test/fixtures/chicago';
import { parseCoordinates } from './parseCoordinates';

const ZERO_COORDINATES = { lat: 0, lon: 0 } as const;
const ZERO_COORDINATES_QUERY = 'lat=0&lon=0';
const CHICAGO_COORDINATES_QUERY = `lat=${CHICAGO.lat}&lon=${CHICAGO.lon}`;
const INVALID_COORDINATE_QUERIES = [
  'lon=0',
  'lat=0',
  'lat=&lon=0',
  'lat=abc&lon=0',
  'lat=0&lon=abc',
  'lat=91&lon=0',
  'lat=-91&lon=0',
  'lat=0&lon=181',
  'lat=0&lon=-181',
] as const;

const params = (query: string) => new URLSearchParams(query);

describe('parseCoordinates', () => {
  it('parses valid coordinates including zero', () => {
    expect(parseCoordinates(params(ZERO_COORDINATES_QUERY))).toEqual(
      ZERO_COORDINATES,
    );
    expect(parseCoordinates(params(CHICAGO_COORDINATES_QUERY))).toEqual({
      lat: CHICAGO.lat,
      lon: CHICAGO.lon,
    });
  });

  it.each(INVALID_COORDINATE_QUERIES)('rejects invalid coordinates: %s', (query) => {
    expect(parseCoordinates(params(query))).toBeNull();
  });
});
