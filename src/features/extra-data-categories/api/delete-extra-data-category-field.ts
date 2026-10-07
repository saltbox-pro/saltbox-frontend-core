import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type DeleteExtraDataCategoryFieldParams = {
  source: string;
  name: string;
  fieldName: string;
};

export async function deleteExtraDataCategoryField({
  source,
  name,
  fieldName,
}: DeleteExtraDataCategoryFieldParams): Promise<ExtraDataCategoryModel> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.fields-manager.error");
  }

  return api.extraDataCategoryFieldDelete({
    source,
    name,
    field_name: fieldName,
  });
}
