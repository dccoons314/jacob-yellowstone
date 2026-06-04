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
