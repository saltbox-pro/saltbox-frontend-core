import { createKeyedLoader, type LoadSource } from "@saltbox/saltbox-frontend-common";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { i18nStore } from "saltbox-core/store";

import { applySourceAccessibility, type TemplateSourceRow } from "../helpers/template-picker-rows";
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
  const sourceRowsRef = useRef(sourceRows);
  const activeKeysRef = useRef(activeKeys);

  sourceRowsRef.current = sourceRows;
  activeKeysRef.current = activeKeys;

  const [accessibilityLoad] = useState(() =>
    createKeyedLoader({
      run: (sourceId: string) => templatePickerService.loadAccessibleTemplateIds(sourceId),
      onSuccess: (accessibleTemplateIds, sourceId) => {
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
      },
    })
  );

  const activeKeysSignature = activeKeys.join("|");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    activeKeysRef.current.forEach((sourceId) => {
      const sourceRow = sourceRowsRef.current.find((row) => row.key === sourceId);
      const state = accessibilityLoad.state(sourceId);

      if (sourceRow && !sourceRow.isAccessibilityLoaded && !state.isLoading && !state.error) {
        accessibilityLoad.run(sourceId).catch(() => undefined);
      }
    });
  }, [accessibilityLoad, activeKeysSignature, isOpen]);

  const getAccessibilityLoad = useCallback(
    (sourceId: string): LoadSource => accessibilityLoad.state(sourceId),
    [accessibilityLoad]
  );

  return { getAccessibilityLoad };
}
