import {
  MinionExtraDataCategoryFieldType,
  type ExtraDataCategoryModel,
  type MinionExtraDataCategoryField,
} from "@saltbox/saltbox-core-api-client";
import dayjs, { type Dayjs } from "dayjs";

export type ExtraDataItemFieldFormValue = {
  type: MinionExtraDataCategoryFieldType;
  value?: unknown;
};

export type ExtraDataItemFormValues = {
  categoryId?: string;
  values: Record<string, ExtraDataItemFieldFormValue>;
};

const INPUT_FIELD_TYPES: readonly MinionExtraDataCategoryFieldType[] = Object.values(
  MinionExtraDataCategoryFieldType
).filter((type) => type !== MinionExtraDataCategoryFieldType.Bytes);

const JSON_FIELD_TYPES: ReadonlySet<MinionExtraDataCategoryFieldType> = new Set([
  MinionExtraDataCategoryFieldType.List,
  MinionExtraDataCategoryFieldType.Dict,
]);

export function isJsonFieldType(type: MinionExtraDataCategoryFieldType): boolean {
  return JSON_FIELD_TYPES.has(type);
}

export function getFieldInputTypes(
  field: MinionExtraDataCategoryField
): MinionExtraDataCategoryFieldType[] {
  const types = field.types ?? [];
  if (types.length === 0) return [...INPUT_FIELD_TYPES];
  return types.filter((type) => INPUT_FIELD_TYPES.includes(type));
}

export function getDefaultFieldInputType(
  inputTypes: readonly MinionExtraDataCategoryFieldType[]
): MinionExtraDataCategoryFieldType | undefined {
  return inputTypes.find((type) => type !== MinionExtraDataCategoryFieldType.None) ?? inputTypes[0];
}

const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function matchesFieldType(type: MinionExtraDataCategoryFieldType, value: unknown): boolean {
  switch (type) {
    case MinionExtraDataCategoryFieldType.Str:
      return typeof value === "string";
    case MinionExtraDataCategoryFieldType.Int:
      return Number.isInteger(value);
    case MinionExtraDataCategoryFieldType.Float:
      return typeof value === "number";
    case MinionExtraDataCategoryFieldType.Bool:
      return typeof value === "boolean";
    case MinionExtraDataCategoryFieldType.Datetime:
      return typeof value === "string" && ISO_DATETIME_PATTERN.test(value);
    case MinionExtraDataCategoryFieldType.List:
    case MinionExtraDataCategoryFieldType.Dict:
      return matchesJsonFieldType(type, value);
    case MinionExtraDataCategoryFieldType.None:
      return value === null;
    default:
      return false;
  }
}

const FIELD_TYPE_DETECTION_ORDER: readonly MinionExtraDataCategoryFieldType[] = [
  MinionExtraDataCategoryFieldType.None,
  MinionExtraDataCategoryFieldType.Bool,
  MinionExtraDataCategoryFieldType.Int,
  MinionExtraDataCategoryFieldType.Float,
  MinionExtraDataCategoryFieldType.Datetime,
  MinionExtraDataCategoryFieldType.List,
  MinionExtraDataCategoryFieldType.Dict,
  MinionExtraDataCategoryFieldType.Str,
];

// The backend keeps a date string as str when str goes first in field types or types are empty,
// so such a string is treated as a date only in the exact format the form sends.
function isDatetimeBeforeStr(field: MinionExtraDataCategoryField): boolean {
  const types = field.types ?? [];
  const strIndex = types.indexOf(MinionExtraDataCategoryFieldType.Str);
  const datetimeIndex = types.indexOf(MinionExtraDataCategoryFieldType.Datetime);

  if (types.length === 0) return false;
  return strIndex === -1 || (datetimeIndex !== -1 && datetimeIndex < strIndex);
}

function isFormDatetimeString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const date = dayjs(value);
  return date.isValid() && date.toISOString() === value;
}

function matchesFieldValueType(
  field: MinionExtraDataCategoryField,
  type: MinionExtraDataCategoryFieldType,
  value: unknown
): boolean {
  if (!matchesFieldType(type, value)) return false;
  if (type !== MinionExtraDataCategoryFieldType.Datetime) return true;
  return isDatetimeBeforeStr(field) || isFormDatetimeString(value);
}

function detectFieldValueType(
  field: MinionExtraDataCategoryField,
  value: unknown
): MinionExtraDataCategoryFieldType | undefined {
  const inputTypes = getFieldInputTypes(field);

  return FIELD_TYPE_DETECTION_ORDER.find(
    (type) => inputTypes.includes(type) && matchesFieldValueType(field, type, value)
  );
}

const ISO_TIMEZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/;

// The backend returns stored datetimes in UTC without a timezone suffix.
function parseBackendDatetime(value: string): Dayjs {
  return dayjs(ISO_TIMEZONE_PATTERN.test(value) ? value : `${value}Z`);
}

function toFormFieldValue(type: MinionExtraDataCategoryFieldType, value: unknown): unknown {
  if (type === MinionExtraDataCategoryFieldType.Datetime) {
    return parseBackendDatetime(value as string);
  }
  if (isJsonFieldType(type)) return JSON.stringify(value, null, 2);
  if (type === MinionExtraDataCategoryFieldType.None) return undefined;
  return value;
}

function toFieldFormValue(
  field: MinionExtraDataCategoryField,
  value: unknown
): ExtraDataItemFieldFormValue | null {
  const valueType = value === undefined ? undefined : detectFieldValueType(field, value);

  if (valueType) {
    return { type: valueType, value: toFormFieldValue(valueType, value) };
  }

  const defaultType = getDefaultFieldInputType(getFieldInputTypes(field));
  return defaultType ? { type: defaultType } : null;
}

export function toExtraDataItemFormValues(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): ExtraDataItemFormValues["values"] {
  return Object.fromEntries(
    (category.fields ?? []).flatMap((field) => {
      const fieldValue = toFieldFormValue(field, record[field.name]);
      return fieldValue ? [[field.name, fieldValue]] : [];
    })
  );
}

export function toEmptyExtraDataItemFormValues(
  category: ExtraDataCategoryModel
): ExtraDataItemFormValues["values"] {
  return toExtraDataItemFormValues(category, {});
}

export function isEmptyFormFieldValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

export function hasFilledExtraDataItemFormValues(
  values: ExtraDataItemFormValues["values"] | undefined
): boolean {
  return Object.values(values ?? {}).some(
    (fieldValue) => !isEmptyFormFieldValue(fieldValue?.value)
  );
}

function fromFormFieldValue(type: MinionExtraDataCategoryFieldType, value: unknown): unknown {
  if (type === MinionExtraDataCategoryFieldType.Datetime) return (value as Dayjs).toISOString();
  if (isJsonFieldType(type)) return JSON.parse(value as string);
  return value;
}

export function toExtraDataItemData(
  category: ExtraDataCategoryModel,
  values: ExtraDataItemFormValues["values"] | undefined
): Record<string, unknown> {
  return Object.fromEntries(
    (category.fields ?? []).flatMap((field) => {
      const fieldValue = values?.[field.name];

      if (fieldValue?.type === MinionExtraDataCategoryFieldType.None) {
        return [[field.name, null]];
      }

      if (!fieldValue || isEmptyFormFieldValue(fieldValue.value)) {
        return [];
      }

      return [[field.name, fromFormFieldValue(fieldValue.type, fieldValue.value)]];
    })
  );
}

export function isEmptyExtraDataItemData(data: Record<string, unknown>): boolean {
  return Object.keys(data).length === 0;
}

function matchesJsonFieldType(type: MinionExtraDataCategoryFieldType, value: unknown): boolean {
  if (type === MinionExtraDataCategoryFieldType.List) return Array.isArray(value);
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJsonOfFieldType(type: MinionExtraDataCategoryFieldType, text: string): boolean {
  try {
    return matchesJsonFieldType(type, JSON.parse(text));
  } catch {
    return false;
  }
}
