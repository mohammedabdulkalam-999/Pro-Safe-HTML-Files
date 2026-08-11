export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatPhoneDisplay(phone: string): string {
  return phone;
}
