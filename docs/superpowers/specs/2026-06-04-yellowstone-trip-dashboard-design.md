# Yellowstone Trip Reference Dashboard Design

## Objective

Create a GitHub Pages single-page dashboard for Yellowstone trip planning reference use each morning, optimized for hiking and photography decisions.

## Scope

### In scope

- Single static page using plain HTML/CSS/JS.
- Top-level park/trip reference data and external park links.
- Current-day astronomy panel with event times and relative "time to/from now" labels.
- Region cards with:
  - suggested locations and activities (user-provided content)
  - current weather
  - 24-hour hourly forecast
- Weather refresh every 30 minutes (fixed, non-configurable).
- Weather resilience with cached fallback behavior and stale-data messaging.

### Out of scope

- Editable planning notes
- Multi-page navigation
- Any live data besides weather

## Regions

Top-level region sections:

1. cooke city-lamar valley-tower junction
2. old faithful-madison
3. norris-mammoth
4. yellowstone lake

## Information Architecture

Page layout order:

1. **Park Overview Bar**
   - trip date range
   - external links (Google Maps, AllTrails, NPS)
   - Yellowstone-wide weather summary ("current + today")
2. **Today's Astro Timing Panel**
   - sunrise/sunset
   - moonrise/moonset
   - golden hour and blue hour windows
   - civil, nautical, and astronomical twilight windows
   - each event/window includes absolute time + relative "time to/from now"
3. **Region Cards**
   - activity/location suggestions per region
   - current weather from region-relevant station data
   - next 24 hours hourly forecast

## Data Architecture

## Static build-time artifacts

- `data/site.json`
  - trip metadata
  - top-level outbound links
- `data/regions.json`
  - region definitions
  - weather metadata (e.g., station IDs, coordinates)
  - suggested activity/location lists (from user)
- `data/astro-2026-06-05_to_2026-06-10.json`
  - astronomy windows/events for each trip day

These files are generated/updated at build/deploy time and shipped statically.

## Runtime live data

- **NWS API**: current station observations
- **Open-Meteo API**: forecast model data (used for hourly forecast display)

Only weather is fetched at runtime.

## Runtime Flow

1. Load static JSON assets.
2. Resolve current date and render today's astro data.
3. Render park overview + links + region activity content immediately.
4. Fetch weather for all regions in parallel.
5. Normalize provider payloads to a shared weather schema.
6. Render per-region weather + compute Yellowstone-wide summary.
7. Persist successful weather payloads and timestamps in browser cache.
8. Repeat weather sync every 30 minutes (fixed interval).

## Caching and Fallback Behavior

On success:

- Store normalized weather payloads and sync timestamps per region.
- Store summary-level weather aggregate with timestamp.

On weather request failure:

- Continue displaying last successful weather data (no blank weather cards).
- Show warning UI below affected forecast:
  - request failed
  - last successful timestamp
  - data is cached/non-live

Staleness policy:

- If last successful sync age is **under 12 hours**:
  - keep normal cached warning mode
- If sync age reaches **12 hours or more**:
  - switch to degraded fallback messaging (more prominent)
  - explicitly label data as stale/non-live with source timestamp
  - keep last successful multi-day forecast snapshot visible until recovery

Recovery:

- On next successful sync, clear degraded mode and return to normal live status.

## Weather Presentation Requirements

### Park-wide summary (top bar)

- derived from region weather data
- shows rough current and today-level overview for Yellowstone

### Region weather blocks

- current conditions from NWS station observations relevant to region
- 24-hour hourly forecast derived from Open-Meteo data
- last-updated timestamp
- stale/fallback warning state when applicable

## Build/Deploy Model

- GitHub Pages static hosting.
- Build/deploy step generates static astronomy and content artifacts.
- Runtime page performs live weather fetches only.

## Testing Strategy

Required verification coverage:

1. **Astronomy data generation tests**
   - trip date range generation correctness
   - required fields present
2. **Weather normalization tests**
   - NWS/Open-Meteo sample payloads transform correctly to internal schema
3. **Aggregation tests**
   - Yellowstone-wide summary computed correctly from region data
   - behavior with partial missing/failed region weather
4. **Staleness and fallback tests**
   - warning mode under 12h stale
   - degraded mode at 12h+ stale
   - recovery transition after successful refresh
5. **Render resilience smoke tests**
   - static sections render even when weather fetches fail

## Open Inputs Needed From User

- region activity/location lists for all four regions
- final outbound link URLs for Google Maps, AllTrails, and NPS destinations
