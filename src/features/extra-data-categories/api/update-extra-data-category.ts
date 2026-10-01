import type {
  ExtraDataCategoryModel,
  ExtraDataCategoryUpdateSchema,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type UpdateExtraDataCategoryParams = {
  source: string;
  name: string;
  data: ExtraDataCategoryUpdateSchema;
};

export async function updateExtraDataCategory({
  source,
  name,
  data,
}: UpdateExtraDataCategoryParams): Promise<ExtraDataCategoryModel> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.fields-editor.error");
  }

  return api.extraDataCategoryUpdate({
    source,
    name,
    ExtraDataCategoryUpdateSchema: data,
  });
}
