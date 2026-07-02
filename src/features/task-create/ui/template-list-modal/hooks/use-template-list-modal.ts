import type { MessageInstance } from "antd/es/message/interface";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";

import { useTemplateAccessibilityLoader } from "./use-template-accessibility-loader";
import { useTemplateListSearch } from "./use-template-list-search";
import { useTemplateSourceRows } from "./use-template-source-rows";

export type UseTemplateListModalParams = {
  isOpen: boolean;
  messageApi: MessageInstance;
};

export type UseTemplateListModalResult = {
  setAppliedSearchQuery: (query: string) => void;
  isLoading: boolean;
  isError: boolean;
  hasNoData: boolean;
  hasNoResults: boolean;
  shouldShowCollapse: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  handleCollapseChange: (keys: string | string[]) => void;
  filteredRows: TemplateSourceRow[];
  searchQuery: string | undefined;
  getSourceLabel: (sourceName: string) => string;
};

export function useTemplateListModal({
  isOpen,
  messageApi,
}: UseTemplateListModalParams): UseTemplateListModalResult {
  const { t, i18n } = useTranslation();

  const { sourceRows, setSourceRows, isLoading, isError } = useTemplateSourceRows({
    isOpen,
    messageApi,
  });

  const {
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
    isOpen,
  });

  useTemplateAccessibilityLoader({
    isOpen,
    activeKeys,
    sourceRows,
    setSourceRows,
  });

  const hasNoData = !isLoading && !isError && sourceRows.length === 0;
  const hasNoResults =
    !isLoading && !isError && hasSearchQuery && sourceRows.length > 0 && filteredRows.length === 0;
  const shouldShowCollapse = !isLoading && !isError && filteredRows.length > 0;

  const getSourceLabel = useCallback(
    (sourceName: string) => sourceName.trim() || t("task-create.unknown-repository"),
    [t]
  );

  return {
    setAppliedSearchQuery,
    isLoading,
    isError,
    hasNoData,
    hasNoResults,
    shouldShowCollapse,
    isSearchReset,
    activeKeys,
    handleCollapseChange,
    filteredRows,
    searchQuery,
    getSourceLabel,
  };
}
