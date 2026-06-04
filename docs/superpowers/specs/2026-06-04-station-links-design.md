# Station Links and Maps Reference Design

## Objective

Show each region’s station ID and station location on one line, with the station ID linking to the station’s public page and a separate Google Maps link for the station coordinates.

## Scope

### In scope

- Region cards display one compact station row instead of separate station blocks.
- The station ID links to `weather.gov` station pages.
- A Google Maps link points to the station coordinates from the region data.
- Best-effort rain and cloud cover indicators are shown from the current NWS observation when available.
- Station links stay in sync when station data changes in the source region template.

### Out of scope

- Changing weather data sources
- Changing the overall dashboard layout
- Adding additional station metadata beyond the linked ID, station location label, and maps link

## Data Source of Truth

The region template remains the source of truth for:

- `stationId`
- `stationName`
- `lat`
- `lon`

`build-static-data.js` continues copying that template into `data/regions.json`, so any future station updates only need to be made in the template data. The renderer should derive both outbound links from the region record instead of hardcoding station-specific URLs elsewhere.

## Rendering Design

Each region card should render a single inline station row with:

- station ID, linked to `https://api.weather.gov/stations/<stationId>`
- station location label immediately beside it
- Google Maps link built from the region coordinates
- best-effort current rain/cloud indicators derived from the station observation payload

The links are derived from the current region object at render time so the UI automatically reflects updates to station IDs, names, or coordinates after the data files are regenerated.

For weather indicators:

- use `presentWeather`, `cloudLayers`, and `precipitationLastHour` when the NWS observation provides them
- fall back to `not reported` when the station response is empty or missing those fields
- avoid implying clear/ dry conditions when the station does not report enough information

## Testing Strategy

Add a render test that confirms:

1. the station row is rendered as a single line
2. the station ID is linked to the `weather.gov` station page
3. the Google Maps link includes the region coordinates
4. rain/cloud cover indicators appear when present and fall back cleanly when missing

Keep the existing build-data coverage so the generated `data/regions.json` stays aligned with the source template.
