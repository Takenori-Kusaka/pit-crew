// Format a duration given in seconds as hours and minutes ("1h 30m", "45m").
// Seconds below a whole minute are dropped.
export function formatDuration(seconds) {
  if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError('seconds must be a non-negative integer');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
