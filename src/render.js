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

function toUtcDate(astroRow) {
  if (!astroRow?.date || !astroRow?.sunrise) {
    return null;
  }

  const dateTime = new Date(`${astroRow.date}T${astroRow.sunrise}:00Z`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
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

export function renderRegionCard(region) {
  const highlights = Array.isArray(region?.highlights) ? region.highlights : [];
  const activities = Array.isArray(region?.activities) ? region.activities : [];

  return `<article class="region-card">
  <h3>${escapeHtml(region?.name ?? '')}</h3>
  ${region?.stationId ? `<p class="station">${escapeHtml(region.stationId)}</p>` : ''}
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

export function renderOverview({ site, astroRows, regions, now = new Date() }) {
  const astroRow = getTodayAstro(astroRows, now);
  const regionCards = Array.isArray(regions) ? regions.map(renderRegionCard).join('\n') : '';

  return `<main class="overview">
  <header>
    <h1>${escapeHtml(site?.park ?? '')}</h1>
  </header>
  ${renderAstroPanel(astroRow, now)}
  <section class="regions">
    ${regionCards}
  </section>
</main>`;
}
