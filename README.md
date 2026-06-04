# Yellowstone Reference Dashboard

Static Yellowstone trip dashboard with generated park data and live weather polling.

## Scripts

- `npm test` — run the Node test suite
- `npm run build` — regenerate `data/site.json`, `data/regions.json`, and the trip astro output

## Deploy

Serve the repository root with any static file server so `index.html` can load the generated JSON from `./data/`.

