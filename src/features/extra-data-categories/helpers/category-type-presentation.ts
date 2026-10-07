import { ExtraDataCategoryType } from "@saltbox/saltbox-core-api-client";

const TYPE_TAG_COLORS: Record<ExtraDataCategoryType, string> = {
  [ExtraDataCategoryType.Static]: "default",
  [ExtraDataCategoryType.Aggregated]: "purple",
};

export function getExtraDataCategoryTypeColor(type: ExtraDataCategoryType): string {
  return TYPE_TAG_COLORS[type] ?? "default";
}
