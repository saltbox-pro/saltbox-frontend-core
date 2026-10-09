import { ErrorZone, type LoadSource } from "@saltbox/saltbox-frontend-common";
import { Button, Empty, Flex } from "antd";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import type { PickedTemplate } from "../type/types";

import { TemplateListSourcesCollapse } from "./template-list-sources-collapse";
import styles from "./template-picker-modal.module.css";

export type TemplatePickerContentProps = {
  isLoading: boolean;
  loader: LoadSource;
  hasNoData: boolean;
  hasNoResults: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  filteredRows: TemplateSourceRow[];
  searchQuery?: string;
  customFunctionAction?: ReactNode;
  getSourceLabel: (sourceName: string) => string;
  getAccessibilityLoad: (sourceId: string) => LoadSource;
  onCollapseChange: (keys: string | string[]) => void;
  onSelectTemplate: (template: PickedTemplate) => void;
  onGoToConfigurationTemplates: () => void;
};

export const TemplatePickerContent = observer(function TemplatePickerContent({
  isLoading,
  loader,
  hasNoData,
  hasNoResults,
  isSearchReset,
  activeKeys,
  filteredRows,
  searchQuery,
  customFunctionAction,
  getSourceLabel,
  getAccessibilityLoad,
  onCollapseChange,
  onSelectTemplate,
  onGoToConfigurationTemplates,
}: TemplatePickerContentProps) {
  const { t } = useTranslation();

  const shouldShowCollapse = !isLoading && !loader.error && filteredRows.length > 0;

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
      <ErrorZone level="block" loaders={[loader]}>
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
            getAccessibilityLoad={getAccessibilityLoad}
            onCollapseChange={onCollapseChange}
            onSelectTemplate={onSelectTemplate}
          />
        )}
      </ErrorZone>
    </div>
  );
});
