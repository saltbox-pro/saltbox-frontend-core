import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { getLocalizedText } from "@saltbox/saltbox-frontend-common";

export type ExtraDataCategoryDisplaySource = Pick<ExtraDataCategoryModel, "name" | "title">;

export function getExtraDataCategoryDisplayName(
  category: ExtraDataCategoryDisplaySource,
  language: string
): string {
  return getLocalizedText(category.title, language) || category.name;
}
