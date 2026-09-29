import type {
  ExtraDataCategoryModel,
  StaticExtraDataItemSchema,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type CreateMinionExtraDataItemParams = {
  category: ExtraDataCategoryModel;
  minionId: string;
  data: Record<string, unknown>;
};

export async function createMinionExtraDataItem({
  category,
  minionId,
  data,
}: CreateMinionExtraDataItemParams): Promise<StaticExtraDataItemSchema> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.item-form.error");
  }

  return api.extraDataItemCreate({
    StaticExtraDataItemRequestSchema: {
      category_source: category.source,
      category_name: category.name,
      minion_id: minionId,
      data,
    },
  });
}
