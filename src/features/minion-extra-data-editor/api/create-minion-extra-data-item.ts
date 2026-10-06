import type {
  ExtraDataCategoryModel,
  ExtraDataItemsCreateResponseSchema,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type CreateMinionExtraDataItemParams = {
  category: ExtraDataCategoryModel;
  minionIds: readonly string[];
  data: Record<string, unknown>;
};

export async function createMinionExtraDataItem({
  category,
  minionIds,
  data,
}: CreateMinionExtraDataItemParams): Promise<ExtraDataItemsCreateResponseSchema> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.item-form.error");
  }

  return api.extraDataItemCreate({
    ExtraDataItemCreateRequestSchema: {
      category_source: category.source,
      category_name: category.name,
      minion_ids: [...minionIds],
      data,
    },
  });
}
