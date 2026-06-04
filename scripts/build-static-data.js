#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAstroRows } from './generate-astro.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const sourceDir = path.join(dataDir, 'source');

function readJson(filePath) {
  return readFile(filePath, 'utf8').then((raw) => JSON.parse(raw));
}

async function main() {
  await mkdir(dataDir, { recursive: true });

  const site = await readJson(path.join(sourceDir, 'site.template.json'));
  const regions = await readJson(path.join(sourceDir, 'regions.template.json'));

  const { startDate, endDate } = site.trip;
  const { lat, lon } = site.astro;
  const astroRows = generateAstroRows({ startDate, endDate, lat, lon });

  await writeFile(path.join(dataDir, 'site.json'), JSON.stringify(site, null, 2) + '\n');
  await writeFile(path.join(dataDir, 'regions.json'), JSON.stringify(regions, null, 2) + '\n');
  await writeFile(
    path.join(dataDir, `astro-${startDate}_to_${endDate}.json`),
    JSON.stringify(astroRows, null, 2) + '\n'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
