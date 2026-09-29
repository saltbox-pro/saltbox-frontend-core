import {
  ExtraDataCategoryType,
  type ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

export function canAddExtraDataManually(category: ExtraDataCategoryModel): boolean {
  return category.type === ExtraDataCategoryType.Static && !!category.is_manual_data_allowed;
}
