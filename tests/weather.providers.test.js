import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchNwsCurrent } from '../src/weather/providers/nws.js';
import { fetchOpenMeteoHourly } from '../src/weather/providers/openmeteo.js';

test('fetchNwsCurrent calls NWS endpoint and maps metric values', async () => {
  const calls = [];
  const fetchMock = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        properties: {
          timestamp: '2026-06-05T10:00:00+00:00',
          temperature: { value: 20 },
          windSpeed: { value: 16.0934 },
          textDescription: 'Mostly Cloudy'
        }
      })
    };
  };

  const result = await fetchNwsCurrent('KJAC', fetchMock);

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.weather.gov/stations/KJAC/observations/latest'
  );
  assert.equal(calls[0].options.headers.Accept, 'application/geo+json');
  assert.deepEqual(result, {
    source: 'nws',
    stationId: 'KJAC',
    observedAt: '2026-06-05T10:00:00+00:00',
    temperatureF: 68,
    windMph: 10,
    summary: 'Mostly Cloudy'
  });
});

test('fetchOpenMeteoHourly calls Open-Meteo endpoint and maps hourly rows', async () => {
  const calls = [];
  const fetchMock = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({
        latitude: 44.6,
        longitude: -110.5,
        timezone: 'UTC',
        hourly: {
          time: ['2026-06-05T10:00', '2026-06-05T11:00'],
          temperature_2m: [55, 57],
          wind_speed_10m: [7, 8],
          precipitation_probability: [20, 10]
        }
      })
    };
  };

  const result = await fetchOpenMeteoHourly(44.6, -110.5, fetchMock);

  assert.equal(calls.length, 1);
  const calledUrl = new URL(calls[0]);
  assert.equal(calledUrl.origin + calledUrl.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.equal(calledUrl.searchParams.get('latitude'), '44.6');
  assert.equal(calledUrl.searchParams.get('longitude'), '-110.5');
  assert.equal(calledUrl.searchParams.get('forecast_days'), '5');
  assert.equal(
    calledUrl.searchParams.get('hourly'),
    'temperature_2m,precipitation_probability,wind_speed_10m'
  );

  assert.deepEqual(result, {
    source: 'open-meteo',
    latitude: 44.6,
    longitude: -110.5,
    timezone: 'UTC',
    hourly: [
      {
        time: '2026-06-05T10:00',
        temperatureF: 55,
        windMph: 7,
        precipitationChance: 20
      },
      {
        time: '2026-06-05T11:00',
        temperatureF: 57,
        windMph: 8,
        precipitationChance: 10
      }
    ]
  });
});
