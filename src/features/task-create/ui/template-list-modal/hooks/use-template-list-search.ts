import { useEffect, useMemo, useState } from "react";

import { getActiveSearchQuery } from "saltbox-core/features/template-source-search";

import { filterSourceRows, type TemplateSourceRow } from "../../../helpers/template-picker-rows";

import { useTemplateCollapseKeys } from "./use-template-collapse-keys";

type UseTemplateListSearchParams = {
  sourceRows: TemplateSourceRow[];
  language: string;
  isOpen: boolean;
};

export function useTemplateListSearch({
  sourceRows,
  language,
  isOpen,
}: UseTemplateListSearchParams) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAppliedSearchQuery("");
    }
  }, [isOpen]);

  const filteredRows = useMemo(
    () => filterSourceRows(sourceRows, appliedSearchQuery, language),
    [appliedSearchQuery, language, sourceRows]
  );

  const searchQuery = useMemo(() => getActiveSearchQuery(appliedSearchQuery), [appliedSearchQuery]);
  const hasSearchQuery = searchQuery !== undefined;

  const { activeKeys, handleCollapseChange, isSearchReset } = useTemplateCollapseKeys({
    filteredRows,
    searchQuery,
    hasSearchQuery,
    appliedSearchQuery,
    language,
    isOpen,
  });

  return {
    setAppliedSearchQuery,
    filteredRows,
    searchQuery,
    hasSearchQuery,
    activeKeys,
    handleCollapseChange,
    isSearchReset,
  };
}
