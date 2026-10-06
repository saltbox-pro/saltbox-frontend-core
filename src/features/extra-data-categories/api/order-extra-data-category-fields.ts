import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type OrderExtraDataCategoryFieldsParams = {
  source: string;
  name: string;
  fieldNames: readonly string[];
};

export async function orderExtraDataCategoryFields({
  source,
  name,
  fieldNames,
}: OrderExtraDataCategoryFieldsParams): Promise<ExtraDataCategoryModel> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.fields-manager.error");
  }

  return api.extraDataCategoryFieldsOrder({
    source,
    name,
    ExtraDataCategoryFieldsOrderRequestSchema: {
      field_names: [...fieldNames],
    },
  });
}
