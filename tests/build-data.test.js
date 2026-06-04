import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateAstroRows } from '../scripts/generate-astro.js';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

test('generateAstroRows returns one row per trip day', () => {
  const rows = generateAstroRows({
    startDate: '2026-06-05',
    endDate: '2026-06-10',
    lat: 44.6,
    lon: -110.5
  });
  assert.equal(rows.length, 6);
});

test('generateAstroRows rejects invalid calendar dates', () => {
  assert.throws(() => {
    generateAstroRows({
      startDate: '2026-02-31',
      endDate: '2026-03-02',
      lat: 44.6,
      lon: -110.5
    });
  }, /Invalid date: 2026-02-31/);
});

test('site template includes trip metadata and external links', () => {
  const site = readJson('../data/source/site.template.json');

  assert.equal(site.park, 'Yellowstone National Park');
  assert.deepEqual(site.trip, {
    startDate: '2026-06-05',
    endDate: '2026-06-10'
  });
  assert.deepEqual(site.astro, {
    lat: 44.6,
    lon: -110.5,
    timezone: 'America/Denver'
  });
  assert.deepEqual(Object.keys(site.links).sort(), ['allTrails', 'googleMaps', 'nps']);
});

test('regions template includes four placeholder planning sections', () => {
  const regions = readJson('../data/source/regions.template.json');

  assert.equal(regions.length, 4);
  assert.deepEqual(
    regions.map((region) => region.stationId),
    ['YLAW4', 'OFAW4', 'YLAW4', 'KP60']
  );
  for (const region of regions) {
    assert.equal(typeof region.id, 'string');
    assert.equal(typeof region.name, 'string');
    assert.equal(typeof region.stationId, 'string');
    assert.equal(typeof region.stationName, 'string');
    assert.equal(typeof region.lat, 'number');
    assert.equal(typeof region.lon, 'number');
    assert.ok(Array.isArray(region.activities));
    assert.ok(region.activities.length > 0);
    assert.ok(Array.isArray(region.highlights));
    assert.ok(region.highlights.length > 0);
  }
});

test('generated data outputs stay in sync with the templates', () => {
  const site = readJson('../data/source/site.template.json');
  const regions = readJson('../data/source/regions.template.json');
  const siteOutput = readJson('../data/site.json');
  const regionsOutput = readJson('../data/regions.json');
  const astroOutput = readJson('../data/astro-2026-06-05_to_2026-06-10.json');

  assert.deepEqual(siteOutput, site);
  assert.deepEqual(regionsOutput, regions);
  assert.deepEqual(
    astroOutput,
    generateAstroRows({
      startDate: site.trip.startDate,
      endDate: site.trip.endDate,
      lat: site.astro.lat,
      lon: site.astro.lon
    })
  );
});
