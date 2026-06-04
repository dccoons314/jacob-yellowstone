function buildHourlyRows(hourly) {
  const times = hourly.time ?? [];
  return times.map((time, index) => ({
    time,
    temperatureF: hourly.temperature_2m?.[index] ?? null,
    windMph: hourly.wind_speed_10m?.[index] ?? null,
    precipitationChance: hourly.precipitation_probability?.[index] ?? null
  }));
}

export async function fetchOpenMeteoHourly(lat, lon, fetchImpl = fetch) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    forecast_days: '5'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    source: 'open-meteo',
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    hourly: buildHourlyRows(data.hourly ?? {})
  };
}
