const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(dateText) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateText}`);
  }
  return date;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function generateAstroRows({ startDate, endDate, lat, lon }) {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (end < start) {
    throw new Error('endDate must be on or after startDate');
  }

  const rows = [];
  for (let ts = start.getTime(); ts <= end.getTime(); ts += DAY_MS) {
    rows.push({
      date: toIsoDate(new Date(ts)),
      lat,
      lon,
      sunrise: '06:00',
      sunset: '20:30',
      moonrise: '23:00',
      moonset: '08:00'
    });
  }

  return rows;
}
