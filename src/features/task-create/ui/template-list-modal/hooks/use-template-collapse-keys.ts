import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getSourceRowSearchExpansion,
  type TemplateSourceRow,
} from "../../../helpers/template-picker-rows";

type UseTemplateCollapseKeysParams = {
  filteredRows: TemplateSourceRow[];
  searchQuery: string | undefined;
  hasSearchQuery: boolean;
  appliedSearchQuery: string;
  language: string;
};

export function useTemplateCollapseKeys({
  filteredRows,
  searchQuery,
  hasSearchQuery,
  appliedSearchQuery,
  language,
}: UseTemplateCollapseKeysParams) {
  const [manualActiveKeys, setManualActiveKeys] = useState<string[] | null>(null);
  const isUserControlledRef = useRef(false);
  const prevHasSearchQueryRef = useRef(false);

  const isSearchReset = !hasSearchQuery && prevHasSearchQueryRef.current;

  const defaultActiveKeys = useMemo(
    () => (filteredRows.length === 1 ? [filteredRows[0].key] : []),
    [filteredRows]
  );

  const searchForcedActiveKeys = useMemo(() => {
    if (!hasSearchQuery || !searchQuery) {
      return undefined;
    }

    return filteredRows
      .filter(
        (sourceRow) => getSourceRowSearchExpansion(sourceRow, searchQuery, language).expandTemplates
      )
      .map((sourceRow) => sourceRow.key);
  }, [filteredRows, hasSearchQuery, language, searchQuery]);

  const activeKeys = useMemo(() => {
    if (isSearchReset) {
      return defaultActiveKeys;
    }

    if (searchForcedActiveKeys !== undefined && !isUserControlledRef.current) {
      return searchForcedActiveKeys;
    }

    return manualActiveKeys ?? defaultActiveKeys;
  }, [defaultActiveKeys, isSearchReset, manualActiveKeys, searchForcedActiveKeys]);

  useEffect(() => {
    isUserControlledRef.current = false;
    setManualActiveKeys(null);
  }, [appliedSearchQuery]);

  useEffect(() => {
    if (isSearchReset) {
      isUserControlledRef.current = false;
      setManualActiveKeys(null);
    }

    prevHasSearchQueryRef.current = hasSearchQuery;
  }, [hasSearchQuery, isSearchReset]);

  const handleCollapseChange = useCallback((keys: string | string[]) => {
    isUserControlledRef.current = true;
    setManualActiveKeys(Array.isArray(keys) ? keys : keys ? [keys] : []);
  }, []);

  return { activeKeys, handleCollapseChange, isSearchReset };
}
