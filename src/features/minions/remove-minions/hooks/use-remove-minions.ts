import { useCallback, useState } from "react";

import { bulkDeleteMinions } from "../api/bulk-delete-minions";

export interface UseRemoveMinionsOptions {
  collectionSlug: string;
}

export function useRemoveMinions({ collectionSlug }: UseRemoveMinionsOptions) {
  const [isRemoving, setIsRemoving] = useState(false);

  const remove = useCallback(
    async (minionMongoIds: string[]): Promise<void> => {
      setIsRemoving(true);
      try {
        await bulkDeleteMinions({ collectionSlug, minionMongoIds });
      } finally {
        setIsRemoving(false);
      }
    },
    [collectionSlug]
  );

  return { isRemoving, remove };
}
