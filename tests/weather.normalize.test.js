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
