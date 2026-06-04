import test from 'node:test';
import assert from 'node:assert/strict';
import { getStaleMode, cacheWeather, readCachedWeather } from '../src/weather/cache.js';
import { STALE_DEGRADED_HOURS } from '../src/config.js';

const previousLocalStorage = globalThis.localStorage;

test.after(() => {
  globalThis.localStorage = previousLocalStorage;
});

test('getStaleMode returns warning before degraded threshold and degraded at threshold', () => {
  const now = new Date('2026-06-05T12:00:00Z');
  const staleAtWarning = new Date(now.getTime() - (STALE_DEGRADED_HOURS * 60 * 60 * 1000) + 1);
  const staleAtDegraded = new Date(now.getTime() - STALE_DEGRADED_HOURS * 60 * 60 * 1000);

  assert.equal(getStaleMode(staleAtWarning, now), 'warning');
  assert.equal(getStaleMode(staleAtDegraded, now), 'degraded');
});

test('cacheWeather and readCachedWeather round-trip payloads via localStorage', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  };

  const now = new Date('2026-06-05T12:00:00Z');
  const payload = { source: 'nws', temperatureF: 68, windMph: 10 };

  cacheWeather('station:KJAC', payload, now);

  assert.deepEqual(readCachedWeather('station:KJAC'), {
    payload,
    cachedAt: now.toISOString()
  });
});
