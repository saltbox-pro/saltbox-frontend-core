export const formatValue = (value: unknown): string => {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.length > 24 ? `${value.slice(0, 21)}…` : value;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, 3).map((item) => {
      if (typeof item === "string") {
        return item.length > 12 ? `${item.slice(0, 9)}…` : item;
      }
      if (typeof item === "number" || typeof item === "boolean") {
        return String(item);
      }
      return "…";
    });
    return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }

  if (typeof value === "object") {
    return "{…}";
  }

  return "";
};
