import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

export { EXTRA_DATA_CATEGORY_QUERY_PARAM } from "saltbox-core/shared/constants/collection";

import { pickDefaultCategoryName } from "../helpers/categories";

export function resolveActiveExtraDataCategoryName(
  categories: readonly ExtraDataCategoryModel[],
  categoryFromUrl: string | null
): string | null {
  if (categories.length === 0) {
    return null;
  }

  if (categoryFromUrl && categories.some((category) => category.name === categoryFromUrl)) {
    return categoryFromUrl;
  }

  return pickDefaultCategoryName(categories);
}
