import { apiCoreStore } from "saltbox-core/store";

export interface ExportMinionExtraDataParams {
  minionId: string;
  collectionSlug: string;
  categoryId: string;
  search: string;
}

export interface ExportCollectionExtraDataParams {
  collectionSlug: string;
  categoryId: string;
  search: string;
}

export async function exportMinionExtraData({
  minionId,
  collectionSlug,
  categoryId,
  search,
}: ExportMinionExtraDataParams): Promise<Response> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.export-error");
  }

  const response = await api.extraDataItemsByMinionExportRaw({
    MinionExtraDataQueryBody: {
      minion_id: minionId,
      collection_slug: collectionSlug,
      category_id: categoryId,
      search: search || undefined,
    },
  });

  return response.raw;
}

export async function exportCollectionExtraData({
  collectionSlug,
  categoryId,
  search,
}: ExportCollectionExtraDataParams): Promise<Response> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("minions.extra-data.export-error");
  }

  const response = await api.extraDataItemsByCollectionExportRaw({
    CollectionExtraDataQueryBody: {
      collection_slug: collectionSlug,
      category_id: categoryId,
      search: search || undefined,
    },
  });

  return response.raw;
}
