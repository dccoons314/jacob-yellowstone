import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowDegradedBanner, bootstrapWeatherDashboard } from '../src/main.js';

test('shouldShowDegradedBanner flips on at the degraded threshold', () => {
  const now = new Date('2026-06-05T12:00:00Z');
  const fresh = new Date(now.getTime() - (11 * 60 * 60 * 1000));
  const stale = new Date(now.getTime() - (12 * 60 * 60 * 1000));

  assert.equal(shouldShowDegradedBanner(fresh, now), false);
  assert.equal(shouldShowDegradedBanner(stale, now), true);
});

test('bootstrapWeatherDashboard renders weather and schedules refresh', async () => {
  const intervals = [];
  const app = { innerHTML: '' };
  const document = {
    querySelector: (selector) => (selector === '#app' ? app : null)
  };

  const fetchImpl = async (url) => {
    if (url.endsWith('/data/site.json')) {
      return { ok: true, json: async () => ({
        park: 'Yellowstone National Park',
        trip: { startDate: '2026-06-05', endDate: '2026-06-10' },
        astro: { lat: 44.6, lon: -110.5 },
        links: {}
      }) };
    }

    if (url.endsWith('/data/regions.json')) {
      return { ok: true, json: async () => ([
        { id: 'old-faithful-madison', name: 'Old Faithful-Madison', stationId: 'K20U', lat: 44.46, lon: -110.83, highlights: [], activities: [] }
      ]) };
    }

    if (url.endsWith('/data/astro-2026-06-05_to_2026-06-10.json')) {
      return { ok: true, json: async () => ([{ date: '2026-06-05', sunrise: '06:30', sunset: '20:30' }]) };
    }

    if (url.includes('/stations/K20U/observations/latest')) {
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
    }

    if (url.startsWith('https://api.open-meteo.com/v1/forecast?')) {
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
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  const setIntervalImpl = (callback, ms) => {
    intervals.push(ms);
    return { callback, ms };
  };

  await bootstrapWeatherDashboard({
    document,
    fetchImpl,
    setIntervalImpl,
    now: () => new Date('2026-06-05T12:00:00Z')
  });

  assert.equal(intervals[0], 30 * 60 * 1000);
  assert.match(app.innerHTML, /Yellowstone National Park/);
  assert.match(app.innerHTML, /Yellowstone average 68°F/);
  assert.match(app.innerHTML, /Old Faithful-Madison/);
  assert.match(app.innerHTML, /Mostly Cloudy/);
});
