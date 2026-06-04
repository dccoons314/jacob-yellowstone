import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayAstro } from '../src/astro.js';
import { renderAstroPanel, renderOverview, renderRegionCard } from '../src/render.js';

test('getTodayAstro returns the matching row for today', () => {
  const rows = [
    { date: '2026-06-04', sunrise: '06:00' },
    { date: '2026-06-05', sunrise: '06:01' },
    { date: '2026-06-06', sunrise: '06:02' }
  ];

  const today = new Date('2026-06-05T18:00:00Z');

  assert.deepEqual(getTodayAstro(rows, today), rows[1]);
});

test('getTodayAstro falls back to the first row when no date matches', () => {
  const rows = [
    { date: '2026-06-04', sunrise: '06:00' },
    { date: '2026-06-05', sunrise: '06:01' }
  ];

  const today = new Date('2026-06-07T18:00:00Z');

  assert.deepEqual(getTodayAstro(rows, today), rows[0]);
});

test('renderAstroPanel includes sunrise and a relative label', () => {
  const astroRow = { date: '2026-06-05', sunrise: '06:30', sunset: '20:30' };
  const html = renderAstroPanel(astroRow, new Date('2026-06-05T11:00:00Z'));

  assert.match(html, /<section/);
  assert.match(html, /Sunrise/);
  assert.match(html, /in 1h 30m/);
});

test('renderRegionCard combines station links and weather indicators', () => {
  const html = renderRegionCard({
    id: 'old-faithful-madison',
    name: 'Old Faithful-Madison',
    stationId: 'OFAW4',
    stationName: 'Old Faithful Ranger Station',
    lat: 44.46,
    lon: -110.83,
    weather: {
      current: {
        temperatureF: 68,
        windMph: 10,
        icon: 'Mostly Cloudy'
      }
    },
    highlights: ['Old Faithful Geyser', 'Madison River'],
    activities: [{ name: 'Geyser basin walk', details: 'Placeholder' }]
  });

  assert.match(html, /Old Faithful-Madison/);
  assert.match(
    html,
    /<p class="station">.*<a href="https:\/\/api\.weather\.gov\/stations\/OFAW4"[^>]*>OFAW4<\/a>.*Old Faithful Ranger Station.*<a href="https:\/\/www\.google\.com\/maps\?q=44\.46,-110\.83"[^>]*>Google Maps<\/a>.*<\/p>/s
  );
  assert.match(html, /Old Faithful Geyser/);
  assert.match(html, /Geyser basin walk/);
  assert.match(html, /Rain: not reported/);
  assert.match(html, /Clouds: not reported/);
});

test('renderOverview combines the astro panel and region cards', () => {
  const html = renderOverview({
    site: { park: 'Yellowstone National Park' },
    astroRows: [{ date: '2026-06-05', sunrise: '06:30', sunset: '20:30' }],
    regions: [
      { id: 'old-faithful-madison', name: 'Old Faithful-Madison', stationId: 'OFAW4', stationName: 'Old Faithful Ranger Station', highlights: [], activities: [] }
    ],
    now: new Date('2026-06-05T05:00:00Z')
  });

  assert.match(html, /Yellowstone National Park/);
  assert.match(html, /Astro/);
  assert.match(html, /Old Faithful-Madison/);
});
