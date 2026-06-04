function firstValue(value) {
  if (Array.isArray(value)) {
   return value[0] ?? null;
  }

  return value ?? null;
}

function isOpenMeteoPayload(payload) {
  return (
   payload?.source === 'open-meteo' ||
   'temperature_2m' in payload ||
   'weathercode' in payload ||
   'wind_speed_10m' in payload
  );
}

export function normalizeCurrent(payload) {
  if (!payload || typeof payload !== 'object') {
   return null;
  }

  if (payload.source === 'nws') {
   return {
     source: 'nws',
     temperatureF: payload.tempF ?? payload.temperatureF ?? null,
     windMph: payload.windMph ?? null,
     icon: payload.icon ?? payload.summary ?? null
   };
  }

  if (isOpenMeteoPayload(payload)) {
   return {
     source: 'open-meteo',
     temperatureF: firstValue(payload.temperature_2m),
     windMph: firstValue(payload.wind_speed_10m),
     icon: firstValue(payload.weathercode)
   };
  }

  return null;
}
