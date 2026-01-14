export function formatJson(value?: unknown) {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function parseJson(value?: string) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function validateJson(value?: string) {
  if (!value) return undefined;
  try {
    JSON.parse(value);
    return undefined;
  } catch {
    return "Must be valid JSON";
  }
}
