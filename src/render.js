import { getTodayAstro } from './astro.js';
import { formatRelativeLabel } from './time.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseParkDateTimeParts(astroRow) {
  if (!astroRow?.date || !astroRow?.sunrise) {
    return null;
  }

  const [year, month, day] = astroRow.date.split('-').map(Number);
  const [hour, minute, second = 0] = astroRow.sunrise.split(':').map(Number);
  if ([year, month, day, hour, minute, second].some((part) => !Number.isFinite(part))) {
    return null;
  }

  return { year, month, day, hour, minute, second };
}

function getZonedDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
}

function zonedDateTimeToUtc(parts, timeZone) {
  const targetUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let utc = targetUtc;

  for (let i = 0; i < 2; i += 1) {
    const actual = getZonedDateParts(new Date(utc), timeZone);
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const diff = targetUtc - actualUtc;
    if (diff === 0) {
      break;
    }
    utc += diff;
  }

  return new Date(utc);
}

function toUtcDate(astroRow) {
  const parts = parseParkDateTimeParts(astroRow);
  return parts ? zonedDateTimeToUtc(parts, 'America/Denver') : null;
}

function formatTimestamp(timestamp, now = new Date()) {
  if (!timestamp) {
    return '';
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatRelativeLabel(date, now);
}

function renderLinks(links) {
  const entries = [
    ['Google Maps', links?.googleMaps],
    ['AllTrails', links?.allTrails],
    ['NPS', links?.nps]
  ].filter(([, href]) => href);

  if (entries.length === 0) {
    return '';
  }

  return `<nav class="overview-links" aria-label="Park links">
    ${entries
      .map(([label, href]) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
      .join('')}
  </nav>`;
}

function renderWeatherBlock(weather, now) {
  if (!weather?.current) {
    return '<p class="weather-current weather-current--empty">Weather syncing…</p>';
  }

  const temperature = Number.isFinite(weather.current.temperatureF) ? `${Math.round(weather.current.temperatureF)}°F` : '—';
  const wind = Number.isFinite(weather.current.windMph) ? `${Math.round(weather.current.windMph)} mph wind` : null;
  const icon = weather.current.icon ? String(weather.current.icon) : null;

  return `<div class="weather-block">
    <p class="weather-current">${escapeHtml(temperature)}${wind ? ` · ${escapeHtml(wind)}` : ''}</p>
    ${icon ? `<p class="weather-icon">${escapeHtml(icon)}</p>` : ''}
    ${weather.lastSuccessAt ? `<p class="weather-meta">Updated ${escapeHtml(formatTimestamp(weather.lastSuccessAt, now))}</p>` : ''}
    ${weather.staleMode ? `<p class="weather-meta weather-meta--${escapeHtml(weather.staleMode)}">Showing cached data</p>` : ''}
  </div>`;
}

export function renderWeatherBanner(status, now = new Date()) {
  if (!status) {
    return '';
  }

  const title = status.kind === 'degraded' ? 'Degraded weather data' : 'Cached weather in use';
  const lastSuccess = status.lastSuccessAt ? `<span>Last successful sync ${escapeHtml(formatTimestamp(status.lastSuccessAt, now))}.</span>` : '';

  return `<aside class="weather-banner weather-banner--${escapeHtml(status.kind ?? 'warning')}" role="status" aria-live="polite">
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(status.message ?? '')}</span>
    ${lastSuccess}
  </aside>`;
}

export function renderAstroPanel(astroRow, now = new Date()) {
  const sunriseTime = astroRow?.sunrise ?? '';
  const sunriseDateTime = toUtcDate(astroRow);
  const label = sunriseDateTime ? formatRelativeLabel(sunriseDateTime, now) : '';

  return `<section class="astro-panel">
    <h2>Astro</h2>
    <dl>
      <div>
        <dt>Sunrise</dt>
        <dd>${escapeHtml(sunriseTime)}${label ? ` (${escapeHtml(label)})` : ''}</dd>
      </div>
    </dl>
  </section>`;
}

export function renderRegionCard(region, now = new Date()) {
  const highlights = Array.isArray(region?.highlights) ? region.highlights : [];
  const activities = Array.isArray(region?.activities) ? region.activities : [];
  const weather = region?.weather ?? null;
  const stationId = region?.stationId ?? '';
  const stationName = region?.stationName ?? stationId;
  const stationLink = stationId
    ? `<p class="weather-station"><a href="https://api.weather.gov/stations/${encodeURIComponent(stationId)}" target="_blank" rel="noreferrer">NWS station: ${escapeHtml(stationName)}</a></p>`
    : '';

  return `<article class="region-card">
    <h3>${escapeHtml(region?.name ?? '')}</h3>
    ${region?.stationId ? `<p class="station">${escapeHtml(region.stationId)}</p>` : ''}
    ${weather ? renderWeatherBlock(weather, now) : '<p class="weather-current weather-current--empty">Weather syncing…</p>'}
    ${stationLink}
    ${
      highlights.length
        ? `<ul class="highlights">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''
    }
    ${
      activities.length
        ? `<ul class="activities">${activities
            .map((item) => `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.details)}</li>`)
            .join('')}</ul>`
        : ''
    }
  </article>`;
}

export function renderOverview({ site, astroRows, regions, weatherSummary = null, weatherStatus = null, now = new Date() }) {
  const astroRow = getTodayAstro(astroRows, now);
  const regionCards = Array.isArray(regions) ? regions.map((region) => renderRegionCard(region, now)).join('\n') : '';
  const tripRange =
    site?.trip?.startDate && site?.trip?.endDate ? `${site.trip.startDate} → ${site.trip.endDate}` : '';
  const summaryText = Number.isFinite(weatherSummary?.temperatureF)
    ? `Yellowstone average ${Math.round(weatherSummary.temperatureF)}°F`
    : 'Weather syncing…';

  return `<main class="overview">
    <header class="overview-bar">
      <div class="overview-meta">
        <h1>${escapeHtml(site?.park ?? '')}</h1>
        ${tripRange ? `<p class="trip-range">${escapeHtml(tripRange)}</p>` : ''}
        <p class="park-weather">${escapeHtml(summaryText)}</p>
      </div>
      ${renderLinks(site?.links)}
    </header>
    ${renderWeatherBanner(weatherStatus, now)}
    ${renderAstroPanel(astroRow, now)}
    <section class="regions">
      ${regionCards}
    </section>
  </main>`;
}
