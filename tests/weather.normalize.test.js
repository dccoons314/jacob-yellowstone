import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCurrent } from '../src/weather/normalize.js';

test('normalizeCurrent maps NWS keys to spec shape exactly', () => {
  const payload = { source: 'nws', tempF: 68, windMph: 10, icon: 'bkn' };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'nws',
    temperatureF: 68,
    windMph: 10,
    icon: 'bkn'
  });
});

test('normalizeCurrent maps Open-Meteo keys from plan shape exactly', () => {
  const payload = {
    source: 'open-meteo',
    temperature_2m: 55,
    wind_speed_10m: 7,
    weathercode: 3
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'open-meteo',
    temperatureF: 55,
    windMph: 7,
    icon: 3
  });
});

test('normalizeCurrent supports NWS payloads with temperatureF and summary fallback', () => {
  const payload = {
    source: 'nws',
    temperatureF: 68,
    windMph: 10,
    summary: 'Mostly Cloudy'
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'nws',
    temperatureF: 68,
    windMph: 10,
    icon: 'Mostly Cloudy'
  });
});

test('normalizeCurrent handles Open-Meteo arrays and missing wind speed', () => {
  const payload = {
    source: 'open-meteo',
    temperature_2m: [55, 57],
    weathercode: [3, 2]
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'open-meteo',
    temperatureF: 55,
    windMph: null,
    icon: 3
  });
});

test('normalizeCurrent infers Open-Meteo source for provider hourly payloads', () => {
  const payload = {
    time: ['2026-06-05T10:00', '2026-06-05T11:00'],
    temperature_2m: [55, 57],
    precipitation_probability: [20, 10],
    weathercode: [3, 2]
  };

  assert.deepEqual(normalizeCurrent(payload), {
    source: 'open-meteo',
    temperatureF: 55,
    windMph: null,
    icon: 3
  });
});
