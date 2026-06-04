import { WEATHER_REFRESH_MS } from './config.js';
import { computeParkSummary } from './weather/aggregate.js';
import { cacheWeather, readCachedWeather, shouldShowDegradedBanner as isDegradedBanner } from './weather/cache.js';
import { normalizeCurrent } from './weather/normalize.js';
import { fetchNwsCurrent } from './weather/providers/nws.js';
import { fetchOpenMeteoHourly } from './weather/providers/openmeteo.js';
import { renderOverview } from './render.js';

const WEATHER_CACHE_PREFIX = 'yellowstone-weather:';

function getRegionCacheKey(region) {
  return `${WEATHER_CACHE_PREFIX}${region.id}`;
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function loadStaticData(fetchImpl) {
  const site = await fetchJson('./data/site.json', fetchImpl);
  const regions = await fetchJson('./data/regions.json', fetchImpl);
  const astroRows = await fetchJson(`./data/astro-${site.trip.startDate}_to_${site.trip.endDate}.json`, fetchImpl);

  return { site, regions, astroRows };
}

function buildWeatherStatus({ latestSuccessAt, hadFailures, now }) {
  if (!latestSuccessAt) {
    return hadFailures
      ? {
          kind: 'warning',
          message: 'Weather sync failed and no cached weather is available yet.'
        }
      : null;
  }

  if (isDegradedBanner(latestSuccessAt, now)) {
    return {
      kind: 'degraded',
      message: 'Weather data is stale; cached weather is being shown until the next successful sync.',
      lastSuccessAt: latestSuccessAt
    };
  }

  return hadFailures
    ? {
        kind: 'warning',
        message: 'Weather sync failed. Showing the most recent cached weather.',
        lastSuccessAt: latestSuccessAt
      }
    : null;
}

function buildCachedRegion(region, now) {
  const cached = readCachedWeather(getRegionCacheKey(region));
  if (!cached?.payload) {
    return { ...region, weather: null, weatherSource: 'missing' };
  }

  const lastSuccessAt = cached.payload.lastSuccessAt ?? cached.cachedAt ?? null;
  return {
    ...region,
    weather: {
      ...cached.payload,
      cachedAt: cached.cachedAt,
      staleMode: isDegradedBanner(lastSuccessAt, now) ? 'degraded' : 'warning'
    },
    weatherSource: 'cache'
  };
}

async function fetchRegionWeather(region, fetchImpl, now) {
  const [nwsCurrent, openMeteoHourly] = await Promise.all([
    fetchNwsCurrent(region.stationId, fetchImpl),
    fetchOpenMeteoHourly(region.lat, region.lon, fetchImpl)
  ]);

  const weather = {
    current: normalizeCurrent(nwsCurrent),
    forecast: openMeteoHourly,
    lastSuccessAt: now.toISOString()
  };

  cacheWeather(getRegionCacheKey(region), weather, now);

  return {
    ...region,
    weather,
    weatherSource: 'live'
  };
}

async function syncWeather(regions, fetchImpl, now) {
  const settled = await Promise.all(
    regions.map(async (region) => {
      try {
        return await fetchRegionWeather(region, fetchImpl, now);
      } catch (error) {
        const cachedRegion = buildCachedRegion(region, now);
        if (cachedRegion.weather) {
          return {
            ...cachedRegion,
            weatherError: error?.message ?? 'Weather sync failed'
          };
        }

        return {
          ...region,
          weather: null,
          weatherError: error?.message ?? 'Weather sync failed',
          weatherSource: 'missing'
        };
      }
    })
  );

  const weatherSummary = computeParkSummary(settled);
  const timestamps = settled
    .map((region) => region.weather?.lastSuccessAt ?? region.weather?.cachedAt ?? null)
    .filter(Boolean);
  const latestSuccessAt = timestamps.length ? timestamps.sort().at(-1) : null;
  const hadFailures = settled.some((region) => Boolean(region.weatherError));

  return {
    regions: settled,
    weatherSummary,
    weatherStatus: buildWeatherStatus({ latestSuccessAt, hadFailures, now })
  };
}

function renderApp({ mount, site, astroRows, regions, weatherSummary, weatherStatus, now }) {
  mount.innerHTML = renderOverview({
    site,
    astroRows,
    regions,
    weatherSummary,
    weatherStatus,
    now
  });
}

export function shouldShowDegradedBanner(lastSuccessAt, now = new Date()) {
  return isDegradedBanner(lastSuccessAt, now);
}

export async function bootstrapWeatherDashboard(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  const setIntervalImpl = options.setIntervalImpl ?? globalThis.setInterval?.bind(globalThis);
  const clearIntervalImpl = options.clearIntervalImpl ?? globalThis.clearInterval?.bind(globalThis);
  const now = options.now ?? (() => new Date());
  const mount = options.mount ?? documentRef?.querySelector?.('#app');

  if (!documentRef || !mount || typeof fetchImpl !== 'function') {
    return null;
  }

  const { site, regions, astroRows } = await loadStaticData(fetchImpl);
  const initialNow = now();
  const initialRegions = regions.map((region) => buildCachedRegion(region, initialNow));
  const initialSummary = computeParkSummary(initialRegions);
  const initialTimestamps = initialRegions
    .map((region) => region.weather?.lastSuccessAt ?? region.weather?.cachedAt ?? null)
    .filter(Boolean);
  const initialLatestSuccessAt = initialTimestamps.length ? initialTimestamps.sort().at(-1) : null;

  renderApp({
    mount,
    site,
    astroRows,
    regions: initialRegions,
    weatherSummary: initialSummary,
    weatherStatus: buildWeatherStatus({
      latestSuccessAt: initialLatestSuccessAt,
      hadFailures: false,
      now: initialNow
    }),
    now: initialNow
  });

  const refresh = async () => {
    const refreshNow = now();
    const snapshot = await syncWeather(regions, fetchImpl, refreshNow);
    renderApp({
      mount,
      site,
      astroRows,
      ...snapshot,
      now: refreshNow
    });
    return snapshot;
  };

  await refresh();

  const timer = setIntervalImpl
    ? setIntervalImpl(() => {
        refresh().catch((error) => {
          console.error(error);
        });
      }, WEATHER_REFRESH_MS)
    : null;

  return {
    refresh,
    stop() {
      if (timer !== null && clearIntervalImpl) {
        clearIntervalImpl(timer);
      }
    }
  };
}

if (typeof document !== 'undefined' && document.querySelector?.('#app')) {
  bootstrapWeatherDashboard().catch((error) => {
    console.error(error);
  });
}
