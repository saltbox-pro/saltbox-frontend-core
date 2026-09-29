export function isExtraDataPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function toExtraDataCopyValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (isExtraDataPrimitive(value)) return String(value);
  return JSON.stringify(value);
}

export function canFilterExtraDataValue(value: unknown): boolean {
  if (value == null || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0 && value.every(isExtraDataPrimitive);
  }

  return isExtraDataPrimitive(value);
}

const EQUAL_EXTRA_DATA_COLUMN_WIDTH_LIMIT = 11;

export function getEqualExtraDataColumnWidth(columnCount: number): string | undefined {
  if (columnCount <= 0 || columnCount >= EQUAL_EXTRA_DATA_COLUMN_WIDTH_LIMIT) {
    return undefined;
  }

  return `${100 / columnCount}%`;
}

export function buildExtraDataFilterField(
  categorySource: string,
  categoryName: string,
  field: string
): string {
  return `extra.${categorySource}.${categoryName}.${field}`;
}

const EXTRA_DATA_META_FIELDS = new Set(["_source", "_name", "_id", "id", "minions_count"]);

export function collectExtraDataFieldNamesFromRecords(
  records: Array<Record<string, unknown>>
): string[] {
  const seen = new Set<string>();
  const fields: string[] = [];

  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (EXTRA_DATA_META_FIELDS.has(key) || seen.has(key)) {
        continue;
      }
      seen.add(key);
      fields.push(key);
    }
  }

  return fields;
}

export function getDeclaredExtraDataFieldNames(category: {
  fields?: Array<{ name: string }>;
}): string[] {
  return (category.fields ?? []).map((field) => field.name).filter(Boolean);
}

function withMinionsCount(fields: string[]): string[] {
  return fields.includes("minions_count") ? fields : [...fields, "minions_count"];
}

export function getDeclaredCollectionExtraDataFieldNames(category: {
  category_fields?: string[];
}): string[] {
  const fromCategory = (category.category_fields ?? []).filter(Boolean);

  if (fromCategory.length === 0) {
    return [];
  }

  return withMinionsCount(fromCategory);
}

export function collectCollectionExtraDataFieldNamesFromRecords(
  records: Array<Record<string, unknown>>
): string[] {
  return withMinionsCount(collectExtraDataFieldNamesFromRecords(records));
}
