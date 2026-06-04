function toF(celsius) {
  if (typeof celsius !== 'number') return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function kphToMph(kph) {
  if (typeof kph !== 'number') return null;
  return Math.round(kph * 0.621371);
}

function firstObservationLabel(items, key) {
  if (!Array.isArray(items)) {
    return null;
  }

  for (const item of items) {
    const value = item?.[key];
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }

  return null;
}

function extractRainIndicator(properties) {
  const presentWeather = Array.isArray(properties.presentWeather) ? properties.presentWeather : [];
  for (const item of presentWeather) {
    const weather = String(item?.weather ?? '').toLowerCase();
    if (weather && /(rain|drizzle|shower|sprinkle|precip)/.test(weather)) {
      return item.weather;
    }
  }

  const precipitationLastHour = properties.precipitationLastHour?.value ?? null;
  if (Number.isFinite(precipitationLastHour) && precipitationLastHour > 0) {
    return `${precipitationLastHour} mm last hour`;
  }

  return null;
}

export async function fetchNwsCurrent(stationId, fetchImpl = fetch) {
  const url = `https://api.weather.gov/stations/${stationId}/observations/latest`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/geo+json'
    }
  });

  if (!response.ok) {
    throw new Error(`NWS request failed: ${response.status}`);
  }

  const data = await response.json();
  const properties = data.properties ?? {};
  const temperatureF = toF(properties.temperature?.value);
  const rain = extractRainIndicator(properties);
  const clouds = firstObservationLabel(properties.cloudLayers, 'amount');
  const precipitationLastHour = properties.precipitationLastHour?.value ?? null;

  return {
    source: 'nws',
    stationId,
    observedAt: properties.timestamp ?? null,
    tempF: temperatureF,
    temperatureF,
    windMph: kphToMph(properties.windSpeed?.value),
    summary: properties.textDescription ?? null,
    ...(rain !== null ? { rain } : {}),
    ...(clouds !== null ? { clouds } : {}),
    ...(precipitationLastHour !== null ? { precipitationLastHour } : {})
  };
}
