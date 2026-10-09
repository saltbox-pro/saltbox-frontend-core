import {
  MinionExtraDataCategoryFieldType,
  type ExtraDataCategoryModel,
  type MinionExtraDataCategoryField,
} from "@saltbox/saltbox-core-api-client";
import { parseApiDatetime, toApiDatetime } from "@saltbox/saltbox-frontend-common";
import dayjs from "dayjs";

export type ExtraDataItemFormValues = {
  categoryId?: string;
  values: Record<string, unknown>;
};

const JSON_FIELD_TYPES: ReadonlySet<MinionExtraDataCategoryFieldType> = new Set([
  MinionExtraDataCategoryFieldType.List,
  MinionExtraDataCategoryFieldType.Dict,
]);

export function isJsonFieldType(type: MinionExtraDataCategoryFieldType): boolean {
  return JSON_FIELD_TYPES.has(type);
}

export function getFieldInputType(
  field: MinionExtraDataCategoryField
): MinionExtraDataCategoryFieldType | undefined {
  if (field.type === MinionExtraDataCategoryFieldType.Bytes) return undefined;
  return field.type;
}

export function isExtraDataFieldRequired(field: MinionExtraDataCategoryField): boolean {
  return field.is_empty_allowed === false;
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
    default:
      return false;
  }
}

function toFormFieldValue(type: MinionExtraDataCategoryFieldType, value: unknown): unknown {
  if (type === MinionExtraDataCategoryFieldType.Datetime) {
    return parseApiDatetime(value as string);
  }
  if (isJsonFieldType(type)) return JSON.stringify(value, null, 2);
  return value;
}

function toFieldFormValue(field: MinionExtraDataCategoryField, value: unknown): unknown {
  const type = getFieldInputType(field);
  if (!type) return undefined;

  if (value === undefined || value === null || !matchesFieldType(type, value)) {
    return undefined;
  }

  return toFormFieldValue(type, value);
}

export function toExtraDataItemFormValues(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): ExtraDataItemFormValues["values"] {
  return Object.fromEntries(
    (category.fields ?? []).flatMap((field) => {
      if (!getFieldInputType(field)) return [];
      return [[field.name, toFieldFormValue(field, record[field.name])]];
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
  return Object.values(values ?? {}).some((value) => !isEmptyFormFieldValue(value));
}

function fromFormFieldValue(type: MinionExtraDataCategoryFieldType, value: unknown): unknown {
  if (type === MinionExtraDataCategoryFieldType.Datetime) {
    if (!dayjs.isDayjs(value) || !value.isValid()) {
      return undefined;
    }
    return toApiDatetime(value);
  }
  if (isJsonFieldType(type)) return JSON.parse(value as string);
  return value;
}

export function toExtraDataItemData(
  category: ExtraDataCategoryModel,
  values: ExtraDataItemFormValues["values"] | undefined
): Record<string, unknown> {
  return Object.fromEntries(
    (category.fields ?? []).flatMap((field) => {
      const type = getFieldInputType(field);
      const fieldValue = values?.[field.name];

      if (!type || isEmptyFormFieldValue(fieldValue)) {
        return [];
      }

      const nextValue = fromFormFieldValue(type, fieldValue);
      if (nextValue === undefined) {
        return [];
      }

      return [[field.name, nextValue]];
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
