function extractTemperatureF(region) {
  const weather = region?.weather?.current ?? region?.current ?? region?.currentWeather ?? region;
  const temperatureF = weather?.temperatureF;

  return Number.isFinite(temperatureF) ? temperatureF : null;
}

export function computeParkSummary(regionWeather) {
  const regions = Array.isArray(regionWeather) ? regionWeather : Object.values(regionWeather ?? {});
  const temperatures = regions.map(extractTemperatureF).filter(Number.isFinite);

  if (temperatures.length === 0) {
    return { temperatureF: null };
  }

  const average = temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;

  return {
    temperatureF: Math.round(average)
  };
}
