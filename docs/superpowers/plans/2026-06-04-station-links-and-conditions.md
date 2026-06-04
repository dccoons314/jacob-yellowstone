# Station Links and Current Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each region's station ID and station location on one line with weather.gov and Google Maps links, and add best-effort rain/cloud indicators from the current NWS observation.

**Architecture:** The region template remains the source of truth for station IDs, station labels, and coordinates. The renderer derives all station-facing links from that data at render time so future station updates only need a template edit plus regeneration of `data/regions.json`. NWS observation parsing will expose best-effort rain and cloud indicators that the region card can display with a safe `not reported` fallback when the station payload is sparse.

**Tech Stack:** Plain HTML/CSS/JavaScript, Node.js scripts, Node built-in test runner (`node --test`), GitHub Pages

---

## File Structure

- Modify: `data/source/regions.template.json` — keep station IDs, station labels, and coordinates as the single source of truth
- Modify: `data/regions.json` — generated copy of the region source data used by the runtime
- Modify: `src/weather/providers/nws.js` — expose current observation fields needed for rain/cloud display
- Modify: `src/weather/normalize.js` — normalize station observation payloads into a shared shape for rendering
- Modify: `src/render.js` — combine station ID, station label, and maps link into one inline row; render rain/cloud status text
- Modify: `tests/astro.test.js` — add render assertions for the combined station line and links
- Modify: `tests/weather.providers.test.js` — cover NWS observation fields needed for rain/cloud display
- Modify: `tests/build-data.test.js` — keep template/output sync checks for the station fields

### Task 1: Extend NWS observation parsing for station conditions

**Files:**
- Modify: `src/weather/providers/nws.js`
- Modify: `src/weather/normalize.js`
- Test: `tests/weather.providers.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/weather.providers.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchNwsCurrent } from '../src/weather/providers/nws.js';
import { normalizeCurrent } from '../src/weather/normalize.js';

test('fetchNwsCurrent exposes rain and cloud observation fields', async () => {
  const fetchMock = async () => ({
    ok: true,
    json: async () => ({
      properties: {
        timestamp: '2026-06-05T10:00:00+00:00',
        temperature: { value: 20 },
        windSpeed: { value: 16.0934 },
        textDescription: 'Mostly Cloudy',
        presentWeather: [{ weather: 'Rain' }],
        cloudLayers: [{ amount: 'BKN' }],
        precipitationLastHour: { value: 1.2 }
      }
    })
  });

  const observation = await fetchNwsCurrent('OFAW4', fetchMock);

  assert.deepEqual(normalizeCurrent(observation), {
    source: 'nws',
    temperatureF: 68,
    windMph: 10,
    icon: 'Mostly Cloudy',
    rain: 'Rain',
    clouds: 'BKN',
    precipitationLastHour: 1.2
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/weather.providers.test.js`
Expected: FAIL because `normalizeCurrent()` does not yet expose `rain`, `clouds`, or `precipitationLastHour`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/weather/providers/nws.js
function toF(celsius) {
  if (typeof celsius !== 'number') return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function kphToMph(kph) {
  if (typeof kph !== 'number') return null;
  return Math.round(kph * 0.621371);
}

function firstObservationLabel(items, key) {
  return Array.isArray(items) && items.length > 0 ? items[0]?.[key] ?? null : null;
}

export async function fetchNwsCurrent(stationId, fetchImpl = fetch) {
  const response = await fetchImpl(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
    headers: { Accept: 'application/geo+json' }
  });
  if (!response.ok) {
    throw new Error(`NWS request failed: ${response.status}`);
  }

  const data = await response.json();
  const properties = data.properties ?? {};
  const temperatureF = toF(properties.temperature?.value);

  return {
    source: 'nws',
    stationId,
    observedAt: properties.timestamp ?? null,
    tempF: temperatureF,
    temperatureF,
    windMph: kphToMph(properties.windSpeed?.value),
    summary: properties.textDescription ?? null,
    rain: firstObservationLabel(properties.presentWeather, 'weather'),
    clouds: firstObservationLabel(properties.cloudLayers, 'amount'),
    precipitationLastHour: properties.precipitationLastHour?.value ?? null
  };
}
```

```js
// src/weather/normalize.js
export function normalizeCurrent(payload) {
  // existing NWS/Open-Meteo mapping retained
  if (payload.source === 'nws') {
    return {
      source: 'nws',
      temperatureF: payload.tempF ?? payload.temperatureF ?? null,
      windMph: payload.windMph ?? null,
      icon: payload.icon ?? payload.summary ?? null,
      rain: payload.rain ?? null,
      clouds: payload.clouds ?? null,
      precipitationLastHour: payload.precipitationLastHour ?? null
    };
  }
  // existing Open-Meteo mapping retained
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/weather.providers.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/weather/providers/nws.js src/weather/normalize.js tests/weather.providers.test.js
git commit -m "feat: expose station conditions from NWS observations"
```

### Task 2: Render the combined station row and maps link

**Files:**
- Modify: `src/render.js`
- Test: `tests/astro.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/astro.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRegionCard } from '../src/render.js';

test('renderRegionCard shows station id and location on one linked line', () => {
  const html = renderRegionCard({
    id: 'old-faithful-madison',
    name: 'Old Faithful-Madison',
    stationId: 'OFAW4',
    stationName: 'Old Faithful Ranger Station',
    lat: 44.46,
    lon: -110.83,
    weather: {
      current: {
        temperatureF: 63,
        windMph: 9,
        icon: 'Mostly Cloudy',
        rain: 'Rain',
        clouds: 'BKN',
        precipitationLastHour: null
      }
    },
    highlights: [],
    activities: []
  });

  assert.match(html, /OFAW4.*Old Faithful Ranger Station/);
  assert.match(html, /https:\/\/api\.weather\.gov\/stations\/OFAW4/);
  assert.match(html, /https:\/\/www\.google\.com\/maps\?q=44\.46,-110\.83/);
  assert.match(html, /Rain/);
  assert.match(html, /BKN/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/astro.test.js`
Expected: FAIL because the station row is still split across separate elements.

- [ ] **Step 3: Write minimal implementation**

```js
// src/render.js
function renderStationLine(region) {
  const stationId = region?.stationId ?? '';
  const stationName = region?.stationName ?? stationId;
  const googleMapsUrl =
    region?.lat != null && region?.lon != null
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${region.lat},${region.lon}`)}`
      : null;

  return stationId
    ? `<p class="weather-station">
         <a href="https://api.weather.gov/stations/${encodeURIComponent(stationId)}" target="_blank" rel="noreferrer">${escapeHtml(stationId)}</a>
         <span class="weather-station__name">${escapeHtml(stationName)}</span>
         ${googleMapsUrl ? `<a href="${escapeHtml(googleMapsUrl)}" target="_blank" rel="noreferrer">Google Maps</a>` : ''}
       </p>`
    : '';
}

function renderWeatherBlock(weather, now) {
  const rain = weather?.current?.rain ?? 'not reported';
  const clouds = weather?.current?.clouds ?? 'not reported';
  return `<div class="weather-block">
  <p class="weather-current">${escapeHtml(`${Math.round(weather.current.temperatureF)}°F`)} · ${escapeHtml(`${Math.round(weather.current.windMph)} mph wind`)}</p>
  <p class="weather-icon">${escapeHtml(weather.current.icon ?? '')}</p>
  <p class="weather-conditions">Rain: ${escapeHtml(rain)} · Clouds: ${escapeHtml(clouds)}</p>
  </div>`;
}

export function renderRegionCard(region, now = new Date()) {
  const weather = region?.weather ?? null;
  return `<article class="region-card">
  <h3>${escapeHtml(region?.name ?? '')}</h3>
  ${weather ? renderWeatherBlock(weather, now) : '<p class="weather-current weather-current--empty">Weather syncing…</p>'}
  ${renderStationLine(region)}
  </article>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/astro.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render.js tests/astro.test.js
git commit -m "feat: combine station links and conditions in region cards"
```

### Task 3: Keep generated region data and template coverage aligned

**Files:**
- Modify: `data/source/regions.template.json`
- Modify: `data/regions.json`
- Modify: `tests/build-data.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/build-data.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

test('regions template keeps station label and coordinates for map links', () => {
  const regions = readJson('../data/source/regions.template.json');

  for (const region of regions) {
    assert.equal(typeof region.stationId, 'string');
    assert.equal(typeof region.stationName, 'string');
    assert.equal(typeof region.lat, 'number');
    assert.equal(typeof region.lon, 'number');
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/build-data.test.js`
Expected: FAIL if the template stops carrying station labels or coordinates.

- [ ] **Step 3: Write minimal implementation**

```json
// data/source/regions.template.json
[
  {
    "id": "old-faithful-madison",
    "name": "Old Faithful-Madison",
    "stationId": "OFAW4",
    "stationName": "Old Faithful Ranger Station",
    "lat": 44.46,
    "lon": -110.83,
    "activities": [
      {
        "name": "Geyser basin walk",
        "details": "Placeholder for boardwalk and thermal feature planning."
      }
    ],
    "highlights": [
      "Old Faithful Geyser",
      "Grand Prismatic Spring",
      "Madison River"
    ]
  }
]
```

Regenerate `data/regions.json` with the build script so the runtime data matches the source template.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/build-data.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add data/source/regions.template.json data/regions.json tests/build-data.test.js
git commit -m "chore: keep station metadata in region data"
```

### Task 4: Verify the full dashboard after changes

**Files:**
- None expected unless tests expose an additional regression

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS with all existing dashboard, provider, and build-data tests green.

- [ ] **Step 2: Run the static build**

Run: `npm run build`
Expected: PASS and regenerated `data/site.json`, `data/regions.json`, and astro output remain in sync.

- [ ] **Step 3: Verify deployment**

Run: push the commit and confirm the GitHub Pages workflow completes successfully, then reload the live site and verify:

```text
- station ID and station name appear on one line
- station ID opens the weather.gov station page
- Google Maps link opens the station coordinates
- rain/cloud labels render when the station reports them
- fallback text appears when the station does not report them
```

- [ ] **Step 4: No additional commit**

This task is verification-only after the implementation commits in Tasks 1-3.
