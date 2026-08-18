import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { collectFunctionNamesLower, type TemplateSourceRow } from "../helpers/template-picker-rows";

import { useTemplateAccessibilityLoader } from "./use-template-accessibility-loader";
import { useTemplateListSearch } from "./use-template-list-search";
import { useTemplateSourceRows } from "./use-template-source-rows";

export type UseTemplatePickerParams = {
  isOpen: boolean;
  messageApi: MessageInstance;
};

export type UseTemplatePickerResult = {
  appliedSearchQuery: string;
  setAppliedSearchQuery: (query: string) => void;
  isLoading: boolean;
  isError: boolean;
  hasNoData: boolean;
  hasNoResults: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  handleCollapseChange: (keys: string | string[]) => void;
  filteredRows: TemplateSourceRow[];
  functionNamesLower: Set<string>;
  searchQuery: string | undefined;
  getSourceLabel: (sourceName: string) => string;
};

export function useTemplatePicker({
  isOpen,
  messageApi,
}: UseTemplatePickerParams): UseTemplatePickerResult {
  const { t, i18n } = useTranslation();

  const { sourceRows, setSourceRows, isLoading, isError } = useTemplateSourceRows({
    messageApi,
  });

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

  useTemplateAccessibilityLoader({
    isOpen,
    activeKeys,
    sourceRows,
    setSourceRows,
  });

  const functionNamesLower = useMemo(() => collectFunctionNamesLower(sourceRows), [sourceRows]);

  const hasNoData = !isLoading && !isError && sourceRows.length === 0;
  const hasNoResults =
    !isLoading && !isError && hasSearchQuery && sourceRows.length > 0 && filteredRows.length === 0;

  const getSourceLabel = useCallback(
    (sourceName: string) => sourceName.trim() || t("task-create.unknown-repository"),
    [t]
  );

  return {
    appliedSearchQuery,
    setAppliedSearchQuery,
    isLoading,
    isError,
    hasNoData,
    hasNoResults,
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    functionNamesLower,
    searchQuery,
    getSourceLabel,
  };
}
