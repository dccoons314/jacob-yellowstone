const PARK_TIME_ZONE = 'America/Denver';

function getParkDateKey(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function getTodayAstro(rows, now = new Date()) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const today = getParkDateKey(now);
  return rows.find((row) => row?.date === today) ?? rows[0];
}
