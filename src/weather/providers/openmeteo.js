export async function fetchOpenMeteoHourly(lat, lon, fetchImpl = fetch) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'temperature_2m,precipitation_probability,weathercode',
    forecast_days: '5',
    timezone: 'auto'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const data = await response.json();

  return data.hourly;
}
