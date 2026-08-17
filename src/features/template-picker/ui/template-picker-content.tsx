import { Alert, Button, Empty, Flex, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { FunctionModuleRow } from "../helpers/function-template-rows";
import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import type { PickedTemplate } from "../type/types";

import { FunctionTemplatesSection } from "./function-templates-section";
import { TemplateListSourcesCollapse } from "./template-list-sources-collapse";
import styles from "./template-picker-modal.module.css";

export type TemplatePickerContentProps = {
  isLoading: boolean;
  isError: boolean;
  hasNoData: boolean;
  hasNoResults: boolean;
  isSearchReset: boolean;
  activeKeys: string[];
  slsRows: TemplateSourceRow[];
  functionModuleRows: FunctionModuleRow[];
  isFunctionAccessibilityLoading: boolean;
  hasFunctionAccessibilityError: boolean;
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
  slsRows,
  functionModuleRows,
  isFunctionAccessibilityLoading,
  hasFunctionAccessibilityError,
  searchQuery,
  getSourceLabel,
  onCollapseChange,
  onSelectTemplate,
  onGoToConfigurationTemplates,
}: TemplatePickerContentProps) {
  const { t } = useTranslation();

  const isReady = !isLoading && !isError;
  const shouldShowSlsSection = isReady && slsRows.length > 0;
  const shouldShowFunctionSection =
    isReady && (functionModuleRows.length > 0 || isFunctionAccessibilityLoading);

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

      <Flex vertical gap="middle">
        {shouldShowSlsSection && (
          <section>
            <Typography.Title level={5} className={styles.sectionTitle}>
              {t("template-picker.sls-section-title")}
            </Typography.Title>

            <TemplateListSourcesCollapse
              filteredRows={slsRows}
              activeKeys={activeKeys}
              searchQuery={searchQuery}
              isSearchReset={isSearchReset}
              getSourceLabel={getSourceLabel}
              onCollapseChange={onCollapseChange}
              onSelectTemplate={onSelectTemplate}
            />
          </section>
        )}

        {shouldShowFunctionSection && (
          <section>
            <Typography.Title level={5} className={styles.sectionTitle}>
              {t("template-picker.function-section-title")}
            </Typography.Title>

            <FunctionTemplatesSection
              moduleRows={functionModuleRows}
              isAccessibilityLoading={isFunctionAccessibilityLoading}
              hasAccessibilityError={hasFunctionAccessibilityError}
              onSelectTemplate={onSelectTemplate}
            />
          </section>
        )}
      </Flex>
    </div>
  );
}
