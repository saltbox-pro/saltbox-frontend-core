import type { LoadSource } from "@saltbox/saltbox-frontend-common";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { collectFunctionNamesLower, type TemplateSourceRow } from "../helpers/template-picker-rows";

import { useTemplateAccessibilityLoader } from "./use-template-accessibility-loader";
import { useTemplateListSearch } from "./use-template-list-search";
import { useTemplateSourceRows } from "./use-template-source-rows";

export type UseTemplatePickerParams = {
  isOpen: boolean;
};

export type UseTemplatePickerResult = {
  appliedSearchQuery: string;
  setAppliedSearchQuery: (query: string) => void;
  isLoading: boolean;
  sourceRowsLoad: LoadSource;
  hasNoData: boolean;
  hasNoResults: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  handleCollapseChange: (keys: string | string[]) => void;
  filteredRows: TemplateSourceRow[];
  functionNamesLower: Set<string>;
  searchQuery: string | undefined;
  getSourceLabel: (sourceName: string) => string;
  getAccessibilityLoad: (sourceId: string) => LoadSource;
};

export function useTemplatePicker({ isOpen }: UseTemplatePickerParams): UseTemplatePickerResult {
  const { t, i18n } = useTranslation();

  const { sourceRows, setSourceRows, isLoading, sourceRowsLoad } = useTemplateSourceRows();

  const {
    appliedSearchQuery,
    setAppliedSearchQuery,
    filteredRows,
    searchQuery,
    hasSearchQuery,
    activeKeys,
    handleCollapseChange,
    isSearchReset,
  } = useTemplateListSearch({
    sourceRows,
    language: i18n.language,
  });

  const { getAccessibilityLoad } = useTemplateAccessibilityLoader({
    isOpen,
    activeKeys,
    sourceRows,
    setSourceRows,
  });

  const functionNamesLower = useMemo(() => collectFunctionNamesLower(sourceRows), [sourceRows]);

  const hasError = Boolean(sourceRowsLoad.error);
  const hasNoData = !isLoading && !hasError && sourceRows.length === 0;
  const hasNoResults =
    !isLoading && !hasError && hasSearchQuery && sourceRows.length > 0 && filteredRows.length === 0;

  const getSourceLabel = useCallback(
    (sourceName: string) => sourceName.trim() || t("task-create.unknown-repository"),
    [t]
  );

  return {
    appliedSearchQuery,
    setAppliedSearchQuery,
    isLoading,
    sourceRowsLoad,
    hasNoData,
    hasNoResults,
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    functionNamesLower,
    searchQuery,
    getSourceLabel,
    getAccessibilityLoad,
  };
}
