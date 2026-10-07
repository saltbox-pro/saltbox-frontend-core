import type {
  ExtraDataCategoryCreateRequestSchema,
  ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export async function createExtraDataCategory(
  body: ExtraDataCategoryCreateRequestSchema
): Promise<ExtraDataCategoryModel> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.create.error");
  }

  return api.extraDataCategoryCreate({ ExtraDataCategoryCreateRequestSchema: body });
}
