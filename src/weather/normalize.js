function toF(celsius) {
  if (typeof celsius !== 'number') return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function kphToMph(kph) {
  if (typeof kph !== 'number') return null;
  return Math.round(kph * 0.621371);
}

export function normalizeCurrent(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.source === 'nws') {
    const properties = payload.properties ?? {};
    return {
      source: 'nws',
      observedAt: properties.timestamp ?? payload.observedAt ?? null,
      temperatureF:
        payload.temperatureF ?? toF(properties.temperature?.value),
      windMph: payload.windMph ?? kphToMph(properties.windSpeed?.value),
      summary: properties.textDescription ?? payload.summary ?? null
    };
  }

  if (payload.source === 'open-meteo') {
    const hourly = payload.hourly ?? {};
    if (Array.isArray(hourly)) {
      const first = hourly[0] ?? {};
      return {
        source: 'open-meteo',
        observedAt: first.time ?? null,
        temperatureF: first.temperatureF ?? null,
        windMph: first.windMph ?? null,
        summary: first.summary ?? null
      };
    }

    return {
      source: 'open-meteo',
      observedAt: hourly.time?.[0] ?? null,
      temperatureF: hourly.temperature_2m?.[0] ?? null,
      windMph: hourly.wind_speed_10m?.[0] ?? null,
      summary: null
    };
  }

  return null;
}
