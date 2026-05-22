import type { SaltKeyMinion } from "@saltbox/saltbox-core-api-client";
import { useCallback, useState } from "react";

import { bulkDeleteSaltKeys } from "../api/bulk-delete-salt-keys";

export function useDeleteSaltKeys() {
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(async (minions: SaltKeyMinion[]): Promise<void> => {
    setIsDeleting(true);
    try {
      await bulkDeleteSaltKeys({ minions });
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { isDeleting, remove };
}
