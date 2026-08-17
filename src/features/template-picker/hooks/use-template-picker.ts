import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  buildFunctionModuleRows,
  filterFunctionModuleRows,
  getFunctionNamesLower,
  type FunctionModuleRow,
} from "../helpers/function-template-rows";
import { isFunctionTemplate } from "../helpers/template-kind";
import { toSlsSourceRows, type TemplateSourceRow } from "../helpers/template-picker-rows";

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
  slsRows: TemplateSourceRow[];
  functionModuleRows: FunctionModuleRow[];
  isFunctionAccessibilityLoading: boolean;
  hasFunctionAccessibilityError: boolean;
  functionNamesLower: Set<string>;
  searchQuery: string | undefined;
  getSourceLabel: (sourceName: string) => string;
};

export function useTemplatePicker({
  isOpen,
  messageApi,
}: UseTemplatePickerParams): UseTemplatePickerResult {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const { sourceRows, setSourceRows, isLoading, isError } = useTemplateSourceRows({
    messageApi,
  });

  useTemplateAccessibilityLoader({
    isOpen,
    sourceRows,
    setSourceRows,
  });

  const slsSourceRows = useMemo(() => toSlsSourceRows(sourceRows), [sourceRows]);

  const {
    appliedSearchQuery,
    setAppliedSearchQuery,
    filteredRows: slsRows,
    searchQuery,
    hasSearchQuery,
    activeKeys,
    handleCollapseChange,
    isSearchReset,
  } = useTemplateListSearch({
    sourceRows: slsSourceRows,
    language,
  });

  const getModuleDescription = useCallback(
    (moduleName: string) =>
      t(`job-function-select.module-descriptions.${moduleName}`, {
        defaultValue: t("job-function-select.module-descriptions.default", { module: moduleName }),
      }),
    [t]
  );

  const allFunctionModuleRows = useMemo(
    () => buildFunctionModuleRows(sourceRows, language, getModuleDescription),
    [getModuleDescription, language, sourceRows]
  );

  const functionModuleRows = useMemo(
    () => filterFunctionModuleRows(allFunctionModuleRows, appliedSearchQuery, language),
    [allFunctionModuleRows, appliedSearchQuery, language]
  );

  const functionNamesLower = useMemo(
    () => getFunctionNamesLower(allFunctionModuleRows),
    [allFunctionModuleRows]
  );

  const functionSourceRows = useMemo(
    () => sourceRows.filter((sourceRow) => sourceRow.templates.some(isFunctionTemplate)),
    [sourceRows]
  );

  const isFunctionAccessibilityLoading = functionSourceRows.some(
    (sourceRow) => !sourceRow.isAccessibilityLoaded && !sourceRow.isAccessibilityError
  );

  const hasFunctionAccessibilityError = functionSourceRows.some(
    (sourceRow) => sourceRow.isAccessibilityError
  );

  const hasAnyData = slsSourceRows.length > 0 || allFunctionModuleRows.length > 0;
  const hasAnyResults = slsRows.length > 0 || functionModuleRows.length > 0;

  const hasNoData = !isLoading && !isError && !hasAnyData;
  const hasNoResults = !isLoading && !isError && hasSearchQuery && hasAnyData && !hasAnyResults;

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
    slsRows,
    functionModuleRows,
    isFunctionAccessibilityLoading,
    hasFunctionAccessibilityError,
    functionNamesLower,
    searchQuery,
    getSourceLabel,
  };
}
