const isEmptyBrackets = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const stringValue = String(value).trim();
  return stringValue === "[]" || stringValue === "{}";
};

const tryParseJsonString = (value: string): unknown | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
};

export const isEmptyTableCellValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (isEmptyBrackets(value)) {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  if (typeof value === "object" && Object.keys(value as object).length === 0) {
    return true;
  }

  return false;
};

export const normalizeTableCellValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    const parsed = tryParseJsonString(value);
    if (parsed !== null && typeof parsed === "object") {
      return parsed;
    }
  }

  return value;
};
