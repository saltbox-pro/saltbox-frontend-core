import type { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export interface BulkDeleteSaltKeysParams {
  minions: SaltKeyMinion[];
}

export async function bulkDeleteSaltKeys({ minions }: BulkDeleteSaltKeysParams): Promise<void> {
  if (!apiCoreStore.saltKeysApi) {
    console.error("saltKeysDelete: saltKeysApi is not initialized");
    throw new Error("minions.delete-keys-selected-failed");
  }

  try {
    await apiCoreStore.saltKeysApi.saltKeysDelete({
      SaltKeySetStatusRequestBody: {
        minions,
      },
    });
  } catch (error) {
    console.error("saltKeysDelete failed:", error);
    throw new Error("minions.delete-keys-selected-failed");
  }
}
