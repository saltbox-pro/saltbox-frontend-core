import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from "react";

import { i18nStore } from "saltbox-core/store";

import {
  applySourceAccessibility,
  markSourceAccessibilityError,
  type TemplateSourceRow,
} from "../../../helpers/template-picker-rows";
import { taskTemplateService } from "../../../service";

type UseTemplateAccessibilityLoaderParams = {
  isOpen: boolean;
  activeKeys: string[];
  sourceRows: TemplateSourceRow[];
  setSourceRows: Dispatch<SetStateAction<TemplateSourceRow[]>>;
};

export function useTemplateAccessibilityLoader({
  isOpen,
  activeKeys,
  sourceRows,
  setSourceRows,
}: UseTemplateAccessibilityLoaderParams) {
  const loadingSourceIdsRef = useRef(new Set<string>());
  const sourceRowsRef = useRef(sourceRows);
  const isOpenRef = useRef(isOpen);

  sourceRowsRef.current = sourceRows;
  isOpenRef.current = isOpen;

  const loadAccessibilityForSources = useCallback(
    async (sourceIds: string[], isCancelled: () => boolean) => {
      const sourceIdsToLoad = sourceIds.filter((sourceId) => {
        const sourceRow = sourceRowsRef.current.find((row) => row.key === sourceId);

        return (
          sourceRow &&
          !sourceRow.isAccessibilityLoaded &&
          !sourceRow.isAccessibilityError &&
          !loadingSourceIdsRef.current.has(sourceId)
        );
      });

      if (sourceIdsToLoad.length === 0) {
        return;
      }

      sourceIdsToLoad.forEach((sourceId) => loadingSourceIdsRef.current.add(sourceId));

      await Promise.all(
        sourceIdsToLoad.map(async (sourceId) => {
          try {
            const accessibleTemplateIds =
              await taskTemplateService.loadAccessibleTemplateIds(sourceId);

            if (isCancelled()) {
              return;
            }

            setSourceRows((currentRows) =>
              currentRows.map((sourceRow) =>
                sourceRow.key === sourceId
                  ? applySourceAccessibility(
                      sourceRow,
                      accessibleTemplateIds,
                      i18nStore.currentLanguage
                    )
                  : sourceRow
              )
            );
          } catch {
            if (isCancelled()) {
              return;
            }

            setSourceRows((currentRows) =>
              currentRows.map((sourceRow) =>
                sourceRow.key === sourceId ? markSourceAccessibilityError(sourceRow) : sourceRow
              )
            );
          } finally {
            loadingSourceIdsRef.current.delete(sourceId);
          }
        })
      );
    },
    [setSourceRows]
  );

  useEffect(() => {
    if (!isOpen || activeKeys.length === 0) {
      return;
    }

    let isCancelled = false;
    const shouldSkipUpdate = () => isCancelled || !isOpenRef.current;

    loadAccessibilityForSources(activeKeys, shouldSkipUpdate);

    return () => {
      isCancelled = true;
    };
  }, [activeKeys, isOpen, loadAccessibilityForSources]);
}
