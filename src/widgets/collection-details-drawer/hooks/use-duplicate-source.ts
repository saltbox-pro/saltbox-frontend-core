import type { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useEffect, useState } from "react";

import { CollectionStore } from "saltbox-core/store";

export function useDuplicateSource(
  sourceSlug: string | undefined,
  preloadedSource: CollectionDetailSchema | undefined
) {
  const [sourceStore] = useState(() => new CollectionStore());

  useEffect(() => {
    if (!sourceSlug || preloadedSource) {
      return;
    }

    sourceStore.setCollectionSlug(sourceSlug);
    return () => sourceStore.reset();
  }, [sourceSlug, preloadedSource, sourceStore]);

  const loadedSource =
    sourceSlug && sourceStore.collectionSlug === sourceSlug ? sourceStore.collection : undefined;

  return {
    sourceCollection: preloadedSource ?? loadedSource,
    sourceLoad: sourceStore.collectionLoad,
  };
}
