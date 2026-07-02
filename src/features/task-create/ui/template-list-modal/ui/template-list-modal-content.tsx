import { Alert, Empty } from "antd";
import { useTranslation } from "react-i18next";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";
import type { SelectedTaskTemplate } from "../../../type/types";

import styles from "./template-list-modal.module.css";
import { TemplateListSourcesCollapse } from "./template-list-sources-collapse";

export type TemplateListModalContentProps = {
  isLoading: boolean;
  isError: boolean;
  hasNoData: boolean;
  hasNoResults: boolean;
  shouldShowCollapse: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  filteredRows: TemplateSourceRow[];
  searchQuery?: string;
  getSourceLabel: (sourceName: string) => string;
  onCollapseChange: (keys: string | string[]) => void;
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

export function TemplateListModalContent({
  isLoading,
  isError,
  hasNoData,
  hasNoResults,
  shouldShowCollapse,
  isSearchReset,
  activeKeys,
  filteredRows,
  searchQuery,
  getSourceLabel,
  onCollapseChange,
  onSelectTemplate,
}: TemplateListModalContentProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.modalContent}>
      {!isLoading && isError && (
        <Alert type="error" message={t("task-create.error-loading-templates")} showIcon />
      )}

      {hasNoData && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("task-create.no-sources-available")}
        />
      )}

      {hasNoResults && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("configuration-templates.search.no-results")}
        />
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
