export type PillarValueType = string | number | boolean | null | object | unknown[];

export function isAllowedPillarValue(value: unknown): value is PillarValueType {
  if (value === null) return true;

  const t = typeof value;

  if (t === "string" || t === "number" || t === "boolean") return true;
  if (t === "object" && value !== null) return true;

  return false;
}

export type ParseValueResult =
  | { ok: true; value: PillarValueType }
  | { ok: false; errorKey: string };

export function parseAndValidatePillarValue(raw: string): ParseValueResult {
  const trimmed = raw?.trim();

  if (!trimmed) {
    return { ok: false, errorKey: "pillars.create.field-value-required" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, errorKey: "pillars.create.field-value-invalid-json" };
  }

  if (!isAllowedPillarValue(parsed)) {
    return { ok: false, errorKey: "pillars.create.field-value-invalid-type" };
  }

  return { ok: true, value: parsed };
}

export function isParseValueError(
  result: ParseValueResult
): result is { ok: false; errorKey: string } {
  return !result.ok;
}
