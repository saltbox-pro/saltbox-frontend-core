import { apiCoreStore } from "saltbox-core/store";

export interface BulkDeleteMinionsParams {
  collectionSlug: string;
  minionMongoIds: string[];
}

export async function bulkDeleteMinions({
  collectionSlug,
  minionMongoIds,
}: BulkDeleteMinionsParams): Promise<void> {
  if (!apiCoreStore.minionsApi) {
    console.error("minionBulkDelete: minionsApi is not initialized");
    throw new Error("minions.delete-selected-failed");
  }

  try {
    await apiCoreStore.minionsApi.minionBulkDelete({
      MinionBulkDeleteBody: {
        collection_slug: collectionSlug,
        minions: minionMongoIds,
      },
    });
  } catch (error) {
    console.error("minionBulkDelete failed:", error);
    throw new Error("minions.delete-selected-failed");
  }
}
