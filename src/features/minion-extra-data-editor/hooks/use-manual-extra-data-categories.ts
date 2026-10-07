import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useState } from "react";

import { listManualExtraDataCategories } from "../api/list-manual-extra-data-categories";

export function useManualExtraDataCategories(enabled: boolean) {
  const [categories, setCategories] = useState<ExtraDataCategoryModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const abortController = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        setCategories(await listManualExtraDataCategories(abortController.signal));
      } catch {
        if (!abortController.signal.aborted) setHasError(true);
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    };

    load();

    return () => abortController.abort();
  }, [enabled, reloadKey]);

  return { categories, isLoading, hasError, reload };
}
