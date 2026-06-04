import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCurrent } from '../src/weather/normalize.js';

test('normalizeCurrent maps NWS payload to shared current conditions shape', () => {
  const payload = {
    source: 'nws',
    properties: {
      timestamp: '2026-06-05T10:00:00+00:00',
      temperature: { value: 20 },
      windSpeed: { value: 16.0934 },
      textDescription: 'Mostly Cloudy'
    }
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'nws',
    observedAt: '2026-06-05T10:00:00+00:00',
    temperatureF: 68,
    windMph: 10,
    summary: 'Mostly Cloudy'
  });
});

test('normalizeCurrent maps Open-Meteo hourly payload to shared current conditions shape', () => {
  const payload = {
    source: 'open-meteo',
    hourly: {
      time: ['2026-06-05T10:00'],
      temperature_2m: [55],
      wind_speed_10m: [7],
      precipitation_probability: [20]
    }
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'open-meteo',
    observedAt: '2026-06-05T10:00',
    temperatureF: 55,
    windMph: 7,
    summary: null
  });
});
