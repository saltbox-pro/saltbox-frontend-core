const STRING_PREVIEW_MAX_LEN = 40;
const ARRAY_PREVIEW_MAX_ITEMS = 6;
const ARRAY_ITEM_STRING_MAX_LEN = 28;
const KEY_PREVIEW_MAX_LEN = 36;

export function formatKey(key: string): string {
  const escaped = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const shortened =
    escaped.length > KEY_PREVIEW_MAX_LEN
      ? `${escaped.slice(0, KEY_PREVIEW_MAX_LEN - 3)}…`
      : escaped;
  return `"${shortened}"`;
}

export function formatValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    const shortened =
      value.length > STRING_PREVIEW_MAX_LEN
        ? `${value.slice(0, STRING_PREVIEW_MAX_LEN - 3)}…`
        : value;
    return `"${shortened}"`;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, ARRAY_PREVIEW_MAX_ITEMS).map((item) => {
      if (typeof item === "string") {
        const s =
          item.length > ARRAY_ITEM_STRING_MAX_LEN
            ? `${item.slice(0, ARRAY_ITEM_STRING_MAX_LEN - 3)}…`
            : item;
        return `"${s}"`;
      }
      if (item === null || typeof item === "number" || typeof item === "boolean") {
        return String(item);
      }
      if (Array.isArray(item)) {
        return "[…]";
      }
      if (typeof item === "object") {
        return "{…}";
      }
      return "…";
    });
    const tail = value.length > ARRAY_PREVIEW_MAX_ITEMS ? ", …" : "";
    return `[${items.join(", ")}${tail}]`;
  }

  if (typeof value === "object") {
    return "{…}";
  }

  return "";
}
