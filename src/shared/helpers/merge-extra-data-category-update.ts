import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

export type ExtraDataCategoryUpdatePatch = "all" | "meta" | "fields";

export function mergeExtraDataCategoryUpdate(
  current: ExtraDataCategoryModel,
  updated: ExtraDataCategoryModel,
  patch: ExtraDataCategoryUpdatePatch
): ExtraDataCategoryModel {
  if (patch === "all") {
    return updated;
  }

  if (patch === "meta") {
    return {
      ...current,
      title: updated.title,
      description: updated.description,
      icon: updated.icon,
      modified: updated.modified,
    };
  }

  return {
    ...current,
    fields: updated.fields,
    minion_fields: updated.minion_fields,
    modified: updated.modified,
  };
}
