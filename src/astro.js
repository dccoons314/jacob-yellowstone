export function getTodayAstro(rows, now = new Date()) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const today = now.toISOString().slice(0, 10);
  return rows.find((row) => row?.date === today) ?? rows[0];
}
