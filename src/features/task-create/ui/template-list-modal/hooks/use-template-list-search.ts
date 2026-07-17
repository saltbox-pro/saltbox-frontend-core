import { useMemo, useState } from "react";

import { getActiveSearchQuery } from "saltbox-core/features/template-source-search";

import { filterSourceRows, type TemplateSourceRow } from "../../../helpers/template-picker-rows";

import { useTemplateCollapseKeys } from "./use-template-collapse-keys";

type UseTemplateListSearchParams = {
  sourceRows: TemplateSourceRow[];
  language: string;
};

export function useTemplateListSearch({ sourceRows, language }: UseTemplateListSearchParams) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

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
  });

  return {
    appliedSearchQuery,
    setAppliedSearchQuery,
    filteredRows,
    searchQuery,
    hasSearchQuery,
    activeKeys,
    handleCollapseChange,
    isSearchReset,
  };
}
