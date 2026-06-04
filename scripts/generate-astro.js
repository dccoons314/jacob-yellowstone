const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) {
    throw new Error(`Invalid date: ${dateText}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
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
