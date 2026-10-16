/**
 * Safely parses any date string from backend or ISO input as UTC.
 * Automatically appends 'Z' to offset-naive strings from SQLite to prevent the browser
 * from misinterpreting UTC timestamps as local time (which causes 5h+ timezone skew).
 */
export function parseUtcDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;
  let str = String(dateString).trim();
  if (!str) return null;

  // If the ISO string doesn't end with Z or timezone offset (+HH:MM / -HH:MM),
  // append Z so the browser always interprets it as UTC.
  if (
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(str) &&
    !/[Z+-]\d{2}(:?\d{2})?$/.test(str) &&
    !str.endsWith("Z")
  ) {
    str = str.replace(" ", "T") + "Z";
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats relative time (e.g. "just now", "45s ago", "3m ago", "2h ago", "1d ago").
 */
export function formatRelativeTime(
  dateString: string | Date | null | undefined,
  fallback = "Never"
): string {
  const date = parseUtcDate(dateString);
  if (!date) return fallback;

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle minor clock skew between server and client
  if (diffSeconds < 10 && diffSeconds >= -60) return "just now";
  if (diffSeconds < 60 && diffSeconds >= 0) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60 && diffMinutes >= 0) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24 && diffHours >= 0) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30 && diffDays >= 0) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats normal human-readable local time (e.g. "11:06 PM" or "11:06:15 PM").
 */
export function formatNormalTime(
  dateString: string | Date | null | undefined,
  includeSeconds = false
): string {
  const date = parseUtcDate(dateString);
  if (!date) return "—";

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  });
}

/**
 * Formats normal human-readable local date and time (e.g. "Oct 16, 11:06 PM" or "Oct 16, 2026, 11:06:15 PM").
 */
export function formatNormalDateTime(
  dateString: string | Date | null | undefined,
  includeSeconds = false
): string {
  const date = parseUtcDate(dateString);
  if (!date) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  });
}

/**
 * Formats detailed exact date and time with local timezone code for inspection tooltips and modals.
 */
export function formatExactDateTime(dateString: string | Date | null | undefined): string {
  const date = parseUtcDate(dateString);
  if (!date) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
