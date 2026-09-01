import { Alert, Button, Empty, Flex } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import type { PickedTemplate } from "../type/types";

import { TemplateListSourcesCollapse } from "./template-list-sources-collapse";
import styles from "./template-picker-modal.module.css";

export type TemplatePickerContentProps = {
  isLoading: boolean;
  isError: boolean;
  hasNoData: boolean;
  hasNoResults: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  filteredRows: TemplateSourceRow[];
  searchQuery?: string;
  customFunctionAction?: ReactNode;
  getSourceLabel: (sourceName: string) => string;
  onCollapseChange: (keys: string | string[]) => void;
  onSelectTemplate: (template: PickedTemplate) => void;
  onGoToConfigurationTemplates: () => void;
};

export function TemplatePickerContent({
  isLoading,
  isError,
  hasNoData,
  hasNoResults,
  isSearchReset,
  activeKeys,
  filteredRows,
  searchQuery,
  customFunctionAction,
  getSourceLabel,
  onCollapseChange,
  onSelectTemplate,
  onGoToConfigurationTemplates,
}: TemplatePickerContentProps) {
  const { t } = useTranslation();

  const shouldShowCollapse = !isLoading && !isError && filteredRows.length > 0;

  const emptyStateActions = (
    <Flex justify="center" align="center" gap="small" wrap>
      {customFunctionAction}
      <Button
        type={customFunctionAction ? "default" : "primary"}
        onClick={onGoToConfigurationTemplates}
      >
        {t("task-create.go-to-configuration-templates")}
      </Button>
    </Flex>
  );

  return (
    <div className={styles.modalContent}>
      {!isLoading && isError && (
        <Alert type="error" message={t("task-create.error-loading-templates")} showIcon />
      )}

      {hasNoData && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("task-create.no-sources-available")}
        >
          {emptyStateActions}
        </Empty>
      )}

      {hasNoResults && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("configuration-templates.search.no-results")}
        >
          {emptyStateActions}
        </Empty>
      )}

      {shouldShowCollapse && (
        <TemplateListSourcesCollapse
          filteredRows={filteredRows}
          activeKeys={activeKeys}
          searchQuery={searchQuery}
          isSearchReset={isSearchReset}
          getSourceLabel={getSourceLabel}
          onCollapseChange={onCollapseChange}
          onSelectTemplate={onSelectTemplate}
        />
      )}
    </div>
  );
}
