export function formatRelativeLabel(target, now = new Date()) {
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.trunc(Math.abs(diffMs) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (diffMs >= 0) {
    return `in ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m ago`;
}
