import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

type DeleteMinionExtraDataItemParams = {
  category: ExtraDataCategoryModel;
  minionId: string;
  itemId: string;
};

export async function deleteMinionExtraDataItem({
  category,
  minionId,
  itemId,
}: DeleteMinionExtraDataItemParams): Promise<void> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.delete-item.error");
  }

  await api.extraDataItemDelete({
    item_id: itemId,
    category_source: category.source,
    category_name: category.name,
    minion_id: minionId,
  });
}
