import {
  MinionExtraDataCategoryFieldType,
  type ExtraDataCategoryModel,
  type MinionExtraDataCategoryField,
} from "@saltbox/saltbox-core-api-client";
import type { Dayjs } from "dayjs";

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
  return INPUT_FIELD_TYPES.filter((type) => types.includes(type));
}

export function getDefaultFieldInputType(
  inputTypes: readonly MinionExtraDataCategoryFieldType[]
): MinionExtraDataCategoryFieldType | undefined {
  return inputTypes.find((type) => type !== MinionExtraDataCategoryFieldType.None) ?? inputTypes[0];
}

export function toEmptyExtraDataItemFormValues(
  category: ExtraDataCategoryModel
): ExtraDataItemFormValues["values"] {
  return Object.fromEntries(
    (category.fields ?? []).flatMap((field) => {
      const type = getDefaultFieldInputType(getFieldInputTypes(field));
      return type ? [[field.name, { type }]] : [];
    })
  );
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
