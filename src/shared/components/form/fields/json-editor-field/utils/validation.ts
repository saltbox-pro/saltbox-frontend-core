export type JsonValueType = string | number | boolean | null | object | unknown[];

export function isAllowedJsonValue(value: unknown): value is JsonValueType {
  if (value === null) return true;

  const t = typeof value;

  if (t === "string" || t === "number" || t === "boolean") return true;
  if (t === "object" && value !== null) return true;

  return false;
}

export type ParseValueResult = { ok: true; value: JsonValueType } | { ok: false; errorKey: string };

export function parseAndValidateJsonValue(raw: string): ParseValueResult {
  const trimmed = raw?.trim();

  if (!trimmed) {
    return { ok: false, errorKey: "json-editor-field.value-required" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, errorKey: "json-editor-field.value-invalid-json" };
  }

  if (!isAllowedJsonValue(parsed)) {
    return { ok: false, errorKey: "json-editor-field.value-invalid-type" };
  }

  return { ok: true, value: parsed };
}

export function isParseValueError(
  result: ParseValueResult
): result is { ok: false; errorKey: string } {
  return !result.ok;
}
