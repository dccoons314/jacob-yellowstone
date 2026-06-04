import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAstroRows } from '../scripts/generate-astro.js';

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
