import type {
  ExtraDataImportMode,
  ExtraDataImportResponseSchema,
  UnknownMinionPolicy,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export interface ImportExtraDataParams {
  file: File;
  collectionSlug: string;
  categorySource: string;
  categoryName: string;
  mode: ExtraDataImportMode;
  onUnknownMinion: UnknownMinionPolicy;
}

export async function importExtraData(
  params: ImportExtraDataParams
): Promise<ExtraDataImportResponseSchema> {
  const api = apiCoreStore.extraDataApi;

  if (!api) {
    throw new Error("Extra data API is not available");
  }

  return api.extraDataItemsImport({
    file: params.file,
    collection_slug: params.collectionSlug,
    category_source: params.categorySource,
    category_name: params.categoryName,
    mode: params.mode,
    on_unknown_minion: params.onUnknownMinion,
  });
}
