// Global E.164-ish phone validation. Strips human formatting (spaces, dashes,
// parens, dots) so numbers typed naturally — "+966 50 123 4567", "+20 100-123-4567" —
// validate the same as their unbroken digit form. Also accepts the "00" international
// prefix some countries use in place of "+".
export function normalizePhoneNumber(input: string): string {
  let value = input.trim().replace(/[\s\-().]/g, '');
  if (value.startsWith('00')) {
    value = '+' + value.slice(2);
  }
  return value;
}

const E164_RE = /^\+?[1-9]\d{6,14}$/;

export function isValidPhoneNumber(input: string): boolean {
  return E164_RE.test(normalizePhoneNumber(input));
}
