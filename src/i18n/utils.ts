export function t(dict: Record<string, unknown>, path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  let current: Record<string, unknown> = dict;

  for (const key of keys) {
    if (current === undefined || typeof current !== 'object' || current === null) {
      return path;
    }
    if ((current as Record<string, unknown>)[key] === undefined) {
      return path; // fallback to path if missing
    }
    current = (current as Record<string, unknown>)[key] as Record<string, unknown>;
  }

  let text = String(current);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
  }

  return text;
}

