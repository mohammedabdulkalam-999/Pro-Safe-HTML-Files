const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Normalizes common phone formats to E.164.
 * Examples: "+1 (234) 567-8901" → "+12345678901", "12344543210" → "+112344543210"
 */
export function normalizePhoneNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) return null;

  let normalized: string;

  if (hasPlus) {
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    normalized = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    normalized = `+${digits}`;
  } else if (digits.length >= 11 && digits.length <= 15) {
    normalized = `+${digits}`;
  } else {
    return null;
  }

  return E164_REGEX.test(normalized) ? normalized : null;
}

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}
