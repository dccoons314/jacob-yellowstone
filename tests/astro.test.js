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

  const today = new Date('2026-06-05T12:00:00Z');

  assert.deepEqual(getTodayAstro(rows, today), rows[1]);
});

test('getTodayAstro falls back to the first row when no date matches', () => {
  const rows = [
    { date: '2026-06-04', sunrise: '06:00' },
    { date: '2026-06-05', sunrise: '06:01' }
  ];

  const today = new Date('2026-06-07T12:00:00Z');

  assert.deepEqual(getTodayAstro(rows, today), rows[0]);
});

test('renderAstroPanel includes sunrise and a relative label', () => {
  const astroRow = { date: '2026-06-05', sunrise: '06:30', sunset: '20:30' };
  const html = renderAstroPanel(astroRow, new Date('2026-06-05T05:00:00Z'));

  assert.match(html, /<section/);
  assert.match(html, /Sunrise/);
  assert.match(html, /in 1h 30m/);
});

test('renderRegionCard includes the region name and highlights', () => {
  const html = renderRegionCard({
    id: 'old-faithful-madison',
    name: 'Old Faithful-Madison',
    stationId: 'K20U',
    highlights: ['Old Faithful Geyser', 'Madison River'],
    activities: [{ name: 'Geyser basin walk', details: 'Placeholder' }]
  });

  assert.match(html, /Old Faithful-Madison/);
  assert.match(html, /Old Faithful Geyser/);
  assert.match(html, /Geyser basin walk/);
});

test('renderOverview combines the astro panel and region cards', () => {
  const html = renderOverview({
    site: { park: 'Yellowstone National Park' },
    astroRows: [{ date: '2026-06-05', sunrise: '06:30', sunset: '20:30' }],
    regions: [
      { id: 'old-faithful-madison', name: 'Old Faithful-Madison', stationId: 'K20U', highlights: [], activities: [] }
    ],
    now: new Date('2026-06-05T05:00:00Z')
  });

  assert.match(html, /Yellowstone National Park/);
  assert.match(html, /Astro/);
  assert.match(html, /Old Faithful-Madison/);
});
