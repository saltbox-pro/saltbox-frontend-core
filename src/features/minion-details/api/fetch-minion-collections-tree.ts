import type { CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store/api-core-store";

export function fetchMinionCollectionsTree(
  minionInnerId: string
): Promise<CollectionTreeNodeSchema[]> | undefined {
  return apiCoreStore.minionCollectionsApi?.minionCollectionsTree({
    minion_inner_id: minionInnerId,
    only_available: false,
  });
}
