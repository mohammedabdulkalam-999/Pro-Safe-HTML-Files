/** Escapes special regex characters in a search string. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Returns true when a transcript message matches the search query. */
export function messageMatchesSearch(
  message: string,
  query: string,
): boolean {
  if (!query.trim()) return true;
  return message.toLowerCase().includes(query.trim().toLowerCase());
}

/** Formats an optional transcript timestamp for display. */
export function formatTranscriptTimestamp(timestamp?: string): string | null {
  if (!timestamp?.trim()) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Splits message text into segments for search highlighting. */
export function splitMessageForHighlight(
  text: string,
  query: string,
): { text: string; highlight: boolean }[] {
  if (!query.trim()) {
    return [{ text, highlight: false }];
  }

  const pattern = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === query.trim().toLowerCase(),
  }));
}
