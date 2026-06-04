import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBuildVersion } from '../scripts/prepare-pages.js';

test('applyBuildVersion replaces the build placeholder in index html', () => {
  const input = '<script type="module" src="./src/main.js?build=__BUILD_VERSION__"></script>';
  const output = applyBuildVersion(input, 'dfa3a827fada40f0498659293c47fe3ccc6693e1');

  assert.equal(
    output,
    '<script type="module" src="./src/main.js?build=dfa3a827fada40f0498659293c47fe3ccc6693e1"></script>'
  );
});
