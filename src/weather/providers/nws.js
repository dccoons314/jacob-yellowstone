function toF(celsius) {
  if (typeof celsius !== 'number') return null;
  return Math.round((celsius * 9) / 5 + 32);
}

function kphToMph(kph) {
  if (typeof kph !== 'number') return null;
  return Math.round(kph * 0.621371);
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
  const rain = properties.presentWeather?.[0]?.weather ?? null;
  const clouds = properties.cloudLayers?.[0]?.amount ?? null;
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
