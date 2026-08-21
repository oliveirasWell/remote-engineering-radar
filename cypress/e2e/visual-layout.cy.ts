import { APP_TEXT } from '../../app/constants';

describe('visual weather layout', () => {
  const currentWeather = {
    city: 'Chicago',
    temp: 18,
    condition: 'clear sky',
    iconCode: 800,
    isDay: false,
  };
  const forecast = [
    { date: '2026-08-21', label: 'Today', low: 18, high: 27, iconCode: 800, isPartial: false },
    { date: '2026-08-22', label: 'Saturday', low: 19, high: 28, iconCode: 801, isPartial: false },
    { date: '2026-08-23', label: 'Sunday', low: 20, high: 29, iconCode: 500, isPartial: false },
    { date: '2026-08-24', label: 'Monday', low: 17, high: 25, iconCode: 803, isPartial: false },
    { date: '2026-08-25', label: 'Tuesday', low: 16, high: 24, iconCode: 800, isPartial: false },
  ];

  beforeEach(() => {
    cy.intercept('GET', '/api/geocode*', {
      fixture: '../../lib/weather/fixtures/geocode-chicago.json',
    });
    cy.intercept('GET', '/api/weather*', { body: currentWeather });
    cy.intercept('GET', '/api/forecast*', { body: forecast });
  });

  it('shows the sidebar, weather panel, forecast and disclaimers', () => {
    cy.visit('/');
    cy.get('input[placeholder="Search by city"]').type('Chicago');
    cy.contains('Chicago, Illinois, US').click();
    cy.contains('Chicago, Illinois, US').should('not.exist');
    cy.contains('clear sky').should('not.exist');

    cy.contains('Search').should('be.visible');
    cy.contains(APP_TEXT.weatherHeading).should('be.visible');
    cy.get('i.wi').should('be.visible');
    cy.contains('5-Day Forecast').should('be.visible');
    cy.contains('Today').should('be.visible');
    cy.contains('The information provided by this weather application').should(
      'be.visible',
    );
    cy.contains('Users are advised to consult official government sources').should(
      'be.visible',
    );
  });

  it('shows no results for an empty geocode response', () => {
    cy.intercept('GET', '/api/geocode*', { body: [] });
    cy.visit('/');
    cy.get('input[placeholder="Search by city"]').type('asdfgh');

    cy.contains('No cities found').should('be.visible');
  });
});
