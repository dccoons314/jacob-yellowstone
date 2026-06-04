import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeLabel } from '../src/time.js';

test('formatRelativeLabel returns "in Xh Ym" for future times', () => {
  const now = new Date('2026-06-05T03:00:00Z');
  const target = new Date('2026-06-05T05:00:00Z');
  assert.equal(formatRelativeLabel(target, now), 'in 2h 0m');
});
