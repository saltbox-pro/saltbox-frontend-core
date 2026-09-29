import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";

import { EXTRA_DATA_CATEGORY_FIELDS_NAME } from "../constants/fields-name";

export type ExtraDataCategoryFieldFormValue = {
  name: string;
  types: MinionExtraDataCategoryFieldType[];
  isSaved?: boolean;
};

export type ExtraDataCategoryFieldsFormValues = {
  [EXTRA_DATA_CATEGORY_FIELDS_NAME]: ExtraDataCategoryFieldFormValue[];
};

export function createEmptyExtraDataCategoryField(): ExtraDataCategoryFieldFormValue {
  return { name: "", types: [] };
}

export function toExtraDataCategoryFieldFormValues(
  fields: readonly MinionExtraDataCategoryField[] | undefined
): ExtraDataCategoryFieldFormValue[] {
  return (fields ?? []).map((field) => ({
    name: field.name,
    types: [...(field.types ?? [])],
    isSaved: true,
  }));
}

export function toExtraDataCategoryFieldsFormValues(
  fields: readonly MinionExtraDataCategoryField[] | undefined
): ExtraDataCategoryFieldsFormValues {
  return { [EXTRA_DATA_CATEGORY_FIELDS_NAME]: toExtraDataCategoryFieldFormValues(fields) };
}

export function isDuplicateExtraDataCategoryFieldName(
  fields: readonly ExtraDataCategoryFieldFormValue[] | undefined,
  index: number,
  value: string
): boolean {
  return (fields ?? []).some(
    (field, fieldIndex) => fieldIndex !== index && field?.name?.trim() === value
  );
}

export function toExtraDataCategoryFieldsPayload(
  values: readonly ExtraDataCategoryFieldFormValue[] | undefined
): MinionExtraDataCategoryField[] {
  return (values ?? [])
    .map((value) => ({ name: value.name.trim(), types: [...(value.types ?? [])] }))
    .filter((value) => value.name.length > 0);
}

export function getRetainedMinionFields(
  minionFields: readonly string[] | undefined,
  savedFields: readonly MinionExtraDataCategoryField[] | undefined,
  nextFields: readonly MinionExtraDataCategoryField[]
): string[] {
  const savedNames = new Set((savedFields ?? []).map((field) => field.name));
  const nextNames = new Set(nextFields.map((field) => field.name));

  return (minionFields ?? []).filter((name) => !savedNames.has(name) || nextNames.has(name));
}

export function areExtraDataCategoryFieldFormValuesEqual(
  left: readonly ExtraDataCategoryFieldFormValue[] | undefined,
  right: readonly ExtraDataCategoryFieldFormValue[] | undefined
): boolean {
  const normalize = (fields: readonly ExtraDataCategoryFieldFormValue[] | undefined) =>
    (fields ?? []).map((field) => ({
      name: field?.name?.trim() ?? "",
      types: [...(field?.types ?? [])].sort(),
    }));

  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}
