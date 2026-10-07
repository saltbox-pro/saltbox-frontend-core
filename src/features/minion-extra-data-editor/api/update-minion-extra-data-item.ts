import type { ExtraDataCategoryModel, ExtraDataItemSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type UpdateMinionExtraDataItemParams = {
  category: ExtraDataCategoryModel;
  minionId: string;
  itemId: string;
  data: Record<string, unknown>;
};

export async function updateMinionExtraDataItem({
  category,
  minionId,
  itemId,
  data,
}: UpdateMinionExtraDataItemParams): Promise<ExtraDataItemSchema> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.item-form.error");
  }

  return api.extraDataItemUpdate({
    item_id: itemId,
    ExtraDataItemUpdateRequestSchema: {
      category_source: category.source,
      category_name: category.name,
      minion_id: minionId,
      data,
    },
  });
}
