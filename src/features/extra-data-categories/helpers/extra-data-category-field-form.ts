import type {
  MinionExtraDataCategoryField,
  MinionExtraDataCategoryFieldType,
} from "@saltbox/saltbox-core-api-client";

export type ExtraDataCategoryFieldFormValue = {
  name: string;
  types: MinionExtraDataCategoryFieldType[];
};

export function createEmptyExtraDataCategoryField(): ExtraDataCategoryFieldFormValue {
  return { name: "", types: [] };
}

export function toExtraDataCategoryFieldsPayload(
  values: readonly ExtraDataCategoryFieldFormValue[] | undefined
): MinionExtraDataCategoryField[] {
  return (values ?? [])
    .map((value) => ({ name: value.name.trim(), types: [...(value.types ?? [])] }))
    .filter((value) => value.name.length > 0);
}
