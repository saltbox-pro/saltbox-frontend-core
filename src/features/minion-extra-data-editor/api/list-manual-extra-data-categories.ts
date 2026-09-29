import {
  ExtraDataCategoryType,
  SortOrder,
  type ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

const MANUAL_CATEGORIES_LIMIT = 1000;

export async function listManualExtraDataCategories(
  signal?: AbortSignal
): Promise<ExtraDataCategoryModel[]> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.item-form.categories-error");
  }

  const response = await api.extraDataCategoriesList(
    {
      ExtraDataCategoryListBody: {
        query: { type: ExtraDataCategoryType.Static, is_manual_data_allowed: true },
        sort: { created: SortOrder.NUMBER_MINUS_1 },
        limit: MANUAL_CATEGORIES_LIMIT,
      },
    },
    { signal }
  );

  return response.data;
}
