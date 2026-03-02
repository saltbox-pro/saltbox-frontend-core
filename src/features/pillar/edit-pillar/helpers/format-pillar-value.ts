export function formatPillarValueToString(value: unknown): string {
  if (value === undefined) return "";

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return JSON.stringify(value);
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}
