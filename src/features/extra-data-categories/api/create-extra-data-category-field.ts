import type {
  ExtraDataCategoryFieldCreateRequestSchema,
  ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type CreateExtraDataCategoryFieldParams = {
  source: string;
  name: string;
  field: ExtraDataCategoryFieldCreateRequestSchema;
};

export async function createExtraDataCategoryField({
  source,
  name,
  field,
}: CreateExtraDataCategoryFieldParams): Promise<ExtraDataCategoryModel> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("extra-data-categories.fields-manager.error");
  }

  return api.extraDataCategoryFieldCreate({
    source,
    name,
    ExtraDataCategoryFieldCreateRequestSchema: field,
  });
}
