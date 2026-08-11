const SECRET_ASSIGNMENT = /\b(api[_-]?key|token|secret|password|passwd|authorization)\s*[:=]\s*(["']?)([^\s,;'"`]+)/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/-]{12,}/gi;
const KNOWN_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16})\b/g;

export function redactSensitiveText(value) {
  return value
    .replace(SECRET_ASSIGNMENT, (_, name, quote) => `${name}=${quote}[REDACTED]`)
    .replace(BEARER_TOKEN, 'Bearer [REDACTED]')
    .replace(KNOWN_TOKEN, '[REDACTED]');
}

export function redactValue(value) {
  if (typeof value === 'string') {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item)]));
  }

  return value;
}
