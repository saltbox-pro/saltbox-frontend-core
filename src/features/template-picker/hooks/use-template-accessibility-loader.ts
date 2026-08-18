import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from "react";

import { i18nStore } from "saltbox-core/store";

import {
  applySourceAccessibility,
  markSourceAccessibilityError,
  type TemplateSourceRow,
} from "../helpers/template-picker-rows";
import { templatePickerService } from "../service";

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
  const activeKeysRef = useRef(activeKeys);
  const isMountedRef = useRef(true);

  sourceRowsRef.current = sourceRows;
  activeKeysRef.current = activeKeys;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAccessibilityForSources = useCallback(
    async (sourceIds: string[]) => {
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
              await templatePickerService.loadAccessibleTemplateIds(sourceId);

            if (!isMountedRef.current) {
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
            if (!isMountedRef.current) {
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

  const activeKeysSignature = activeKeys.join("|");

  useEffect(() => {
    const sourceIds = activeKeysRef.current;

    if (!isOpen || sourceIds.length === 0) {
      return;
    }

    loadAccessibilityForSources(sourceIds);
  }, [activeKeysSignature, isOpen, loadAccessibilityForSources]);
}
