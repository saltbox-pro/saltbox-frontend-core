import { apiCoreStore } from "saltbox-core/store";

export interface ExportExtraDataParams {
  collectionSlug: string;
  categoryId: string;
  search: string;
  minionId?: string;
}

export async function exportExtraData({
  collectionSlug,
  categoryId,
  search,
  minionId,
}: ExportExtraDataParams): Promise<Response> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("Extra data API is not available");
  }

  const searchParam = search || undefined;

  if (minionId) {
    const response = await api.extraDataItemsByMinionExportRaw({
      MinionExtraDataQueryBody: {
        minion_id: minionId,
        collection_slug: collectionSlug,
        category_id: categoryId,
        search: searchParam,
      },
    });

    return response.raw;
  }

  const response = await api.extraDataItemsByCollectionExportRaw({
    CollectionExtraDataQueryBody: {
      collection_slug: collectionSlug,
      category_id: categoryId,
      search: searchParam,
    },
  });

  return response.raw;
}
