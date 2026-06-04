import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchNwsCurrent } from '../src/weather/providers/nws.js';
import { fetchOpenMeteoHourly } from '../src/weather/providers/openmeteo.js';
import { normalizeCurrent } from '../src/weather/normalize.js';
import { computeParkSummary } from '../src/weather/aggregate.js';

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
    tempF: 68,
    temperatureF: 68,
    windMph: 10,
    summary: 'Mostly Cloudy'
  });
});

test('fetchOpenMeteoHourly requests required fields and returns json.hourly', async () => {
  const calls = [];
  const fetchMock = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({
        hourly: {
          time: ['2026-06-05T10:00', '2026-06-05T11:00'],
          temperature_2m: [55, 57],
          precipitation_probability: [20, 10],
          weathercode: [3, 2]
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
  assert.equal(calledUrl.searchParams.get('timezone'), 'auto');
  assert.equal(
    calledUrl.searchParams.get('hourly'),
    'temperature_2m,precipitation_probability,weathercode'
  );

  assert.deepEqual(result, {
    time: ['2026-06-05T10:00', '2026-06-05T11:00'],
    temperature_2m: [55, 57],
    precipitation_probability: [20, 10],
    weathercode: [3, 2]
  });
});

test('fetchNwsCurrent output is compatible with normalizeCurrent', async () => {
  const fetchMock = async () => ({
    ok: true,
    json: async () => ({
      properties: {
        timestamp: '2026-06-05T10:00:00+00:00',
        temperature: { value: 20 },
        windSpeed: { value: 16.0934 },
        textDescription: 'Mostly Cloudy',
        presentWeather: [{ weather: 'Rain' }],
        cloudLayers: [{ amount: 'BKN' }],
        precipitationLastHour: { value: 1.2 }
      }
    })
  });

  const providerOutput = await fetchNwsCurrent('KJAC', fetchMock);
  assert.deepEqual(normalizeCurrent(providerOutput), {
    source: 'nws',
    temperatureF: 68,
    windMph: 10,
    icon: 'Mostly Cloudy',
    rain: 'Rain',
    clouds: 'BKN',
    precipitationLastHour: 1.2
  });
});

test('fetchOpenMeteoHourly output is compatible with normalizeCurrent', async () => {
  const fetchMock = async () => ({
    ok: true,
    json: async () => ({
      hourly: {
        time: ['2026-06-05T10:00', '2026-06-05T11:00'],
        temperature_2m: [55, 57],
        precipitation_probability: [20, 10],
        weathercode: [3, 2]
      }
    })
  });

  const providerOutput = await fetchOpenMeteoHourly(44.6, -110.5, fetchMock);
  assert.deepEqual(normalizeCurrent(providerOutput), {
    source: 'open-meteo',
    temperatureF: 55,
    windMph: null,
    icon: 3
  });
});

test('normalized provider outputs can feed the park summary aggregator', () => {
  const summary = computeParkSummary([
    { weather: { current: { temperatureF: 68 } } },
    { weather: { current: { temperatureF: 70 } } },
    { weather: { current: { temperatureF: null } } }
  ]);

  assert.deepEqual(summary, {
    temperatureF: 69
  });
});
