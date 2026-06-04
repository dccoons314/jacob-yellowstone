import test from 'node:test';
import assert from 'node:assert/strict';
import { computeParkSummary } from '../src/weather/aggregate.js';

test('computeParkSummary averages region temperatureF values and rounds to nearest integer', () => {
  const summary = computeParkSummary({
    cookeCity: { temperatureF: 41 },
    oldFaithful: { temperatureF: 44 },
    norris: { temperatureF: 46 }
  });

  assert.deepEqual(summary, {
    temperatureF: 44
  });
});

test('computeParkSummary ignores regions without finite temperatureF values', () => {
  const summary = computeParkSummary({
    cookeCity: { temperatureF: 41 },
    oldFaithful: { temperatureF: null },
    norris: { temperatureF: Number.NaN },
    yellowstoneLake: { temperatureF: 45.6 },
    tower: { }
  });

  assert.deepEqual(summary, {
    temperatureF: 43
  });
});
