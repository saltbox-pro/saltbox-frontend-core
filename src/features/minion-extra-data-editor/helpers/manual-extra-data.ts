import {
  ExtraDataCategoryType,
  type ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

const EXTRA_DATA_RECORD_META_FIELDS: ReadonlySet<string> = new Set([
  "_id",
  "_source",
  "_name",
  "is_system",
  "updated_at",
]);

export function canAddExtraDataManually(category: ExtraDataCategoryModel): boolean {
  return category.type === ExtraDataCategoryType.Static && !!category.is_manual_data_allowed;
}

export function getManualExtraDataRecordId(record: Record<string, unknown>): string | null {
  const { _id: id, is_system: isSystem } = record;
  return isSystem === false && typeof id === "string" ? id : null;
}

export function canChangeExtraDataRecord(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): boolean {
  return canAddExtraDataManually(category) && getManualExtraDataRecordId(record) !== null;
}

export function getUndeclaredExtraDataRecordData(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): Record<string, unknown> {
  const declaredFields = new Set((category.fields ?? []).map(({ name }) => name));

  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => !EXTRA_DATA_RECORD_META_FIELDS.has(key) && !declaredFields.has(key)
    )
  );
}
