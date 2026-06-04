export function normalizeCurrent(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.source === 'nws') {
    return {
      source: 'nws',
      temperatureF: payload.tempF ?? null,
      windMph: payload.windMph ?? null,
      icon: payload.icon ?? null
    };
  }

  if (payload.source === 'open-meteo') {
    return {
      source: 'open-meteo',
      temperatureF: payload.temperature_2m ?? null,
      windMph: payload.wind_speed_10m ?? null,
      icon: payload.weathercode ?? null
    };
  }

  return null;
}
