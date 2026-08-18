import { Alert, Button, Empty } from "antd";
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
  getSourceLabel,
  onCollapseChange,
  onSelectTemplate,
  onGoToConfigurationTemplates,
}: TemplatePickerContentProps) {
  const { t } = useTranslation();

  const shouldShowCollapse = !isLoading && !isError && filteredRows.length > 0;

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
          <Button type="primary" onClick={onGoToConfigurationTemplates}>
            {t("task-create.go-to-configuration-templates")}
          </Button>
        </Empty>
      )}

      {hasNoResults && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("configuration-templates.search.no-results")}
        >
          <Button type="primary" onClick={onGoToConfigurationTemplates}>
            {t("task-create.go-to-configuration-templates")}
          </Button>
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
