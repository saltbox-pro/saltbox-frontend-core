import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

export const DEFAULT_EXTRA_DATA_CATEGORY = "softwares";

export function orderExtraDataCategories(
  categories: readonly ExtraDataCategoryModel[]
): ExtraDataCategoryModel[] {
  const softwaresIndex = categories.findIndex(
    (category) => category.name === DEFAULT_EXTRA_DATA_CATEGORY
  );

  if (softwaresIndex <= 0) {
    return [...categories];
  }

  const softwares = categories[softwaresIndex];
  return [softwares, ...categories.filter((_, index) => index !== softwaresIndex)];
}

export function pickDefaultCategoryName(
  categories: readonly ExtraDataCategoryModel[]
): string | null {
  if (categories.length === 0) {
    return null;
  }

  const softwares = categories.find((category) => category.name === DEFAULT_EXTRA_DATA_CATEGORY);
  return softwares?.name ?? categories[0]?.name ?? null;
}
