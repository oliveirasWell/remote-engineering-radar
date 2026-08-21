/**
 * Feature: City search
 *
 *   Scenario: user searches and sees matching cities
 *     Given I am on the home page
 *     When I type "Chicago" into the search field
 *     Then I see a list of matching cities
 *     And each result shows name, state and country
 */
import chicago from '../fixtures/geocode-chicago.json';
import empty from '../fixtures/geocode-empty.json';
import springfield from '../fixtures/geocode-springfield.json';
import { CHICAGO } from '@/test/fixtures/chicago';
import { NAIROBI } from '@/test/fixtures/nairobi';
import { geocodeResponseSchema } from './geocodeResponse';

describe('geocodeResponseSchema', () => {
  it('parses the Chicago fixture into five entries', () => {
    expect(geocodeResponseSchema.parse(chicago)).toHaveLength(5);
  });

  it('parses the Springfield fixture', () => {
    expect(geocodeResponseSchema.parse(springfield)).toHaveLength(5);
  });

  it('parses an empty response as an empty array', () => {
    expect(geocodeResponseSchema.parse(empty)).toEqual([]);
  });

  it('allows entries without state or local_names', () => {
    expect(geocodeResponseSchema.parse([NAIROBI])).toEqual([
      {
        name: NAIROBI.name,
        country: NAIROBI.country,
        lat: NAIROBI.lat,
        lon: NAIROBI.lon,
      },
    ]);
  });

  it('rejects malformed entries', () => {
    expect(() =>
      geocodeResponseSchema.parse([
        {
          name: CHICAGO.name,
          lat: String(CHICAGO.lat),
          lon: CHICAGO.lon,
          country: CHICAGO.country,
        },
      ]),
    ).toThrow();
    expect(() =>
      geocodeResponseSchema.parse([
        { name: CHICAGO.name, lat: CHICAGO.lat, lon: CHICAGO.lon },
      ]),
    ).toThrow();
  });
});
