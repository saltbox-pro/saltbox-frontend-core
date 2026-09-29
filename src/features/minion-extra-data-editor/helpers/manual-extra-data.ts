import {
  ExtraDataCategoryType,
  type ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

export function canAddExtraDataManually(category: ExtraDataCategoryModel): boolean {
  return category.type === ExtraDataCategoryType.Static && !!category.is_manual_data_allowed;
}

export function getManualExtraDataRecordId(record: Record<string, unknown>): string | null {
  const { _id: id, is_system: isSystem } = record;
  return isSystem === false && typeof id === "string" ? id : null;
}
