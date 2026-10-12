/**
 * Formats ISO date string to readable localized date and time
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns human-friendly relative time (e.g. "2m ago", "Just now")
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats duration milliseconds into readable string (e.g., "45s", "2m 14s")
 */
export function formatDuration(durationMs) {
  if (durationMs == null || durationMs < 0) return '0s';
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return `${mins}m ${remSecs}s`;
}

/**
 * Truncates long session IDs for compact display
 */
export function truncateSessionId(id, prefixLen = 10, suffixLen = 6) {
  if (!id) return '';
  if (id.length <= prefixLen + suffixLen + 3) return id;
  return `${id.substring(0, prefixLen)}...${id.substring(id.length - suffixLen)}`;
}
