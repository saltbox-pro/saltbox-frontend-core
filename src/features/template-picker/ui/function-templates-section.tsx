import { Alert, Button, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { FunctionModuleRow, FunctionTemplateItem } from "../helpers/function-template-rows";
import { toPickedTemplate } from "../helpers/template-kind";
import { useFunctionTemplateTooltips } from "../hooks/use-function-template-tooltips";
import type { PickedTemplate } from "../type/types";

import { FunctionTemplateTooltip } from "./function-template-tooltip";
import styles from "./function-templates-section.module.css";
import { TemplateListPanelSkeleton } from "./template-list-panel-skeleton";

export type FunctionTemplatesSectionProps = {
  moduleRows: FunctionModuleRow[];
  isAccessibilityLoading: boolean;
  hasAccessibilityError: boolean;
  onSelectTemplate: (template: PickedTemplate) => void;
};

export function FunctionTemplatesSection({
  moduleRows,
  isAccessibilityLoading,
  hasAccessibilityError,
  onSelectTemplate,
}: FunctionTemplatesSectionProps) {
  const { t } = useTranslation();
  const { tooltipByFunction, loadingByFunction, resetCounter, loadTooltip, closeTooltips } =
    useFunctionTemplateTooltips();

  const handleSelect = useCallback(
    (functionItem: FunctionTemplateItem) => {
      closeTooltips();
      onSelectTemplate(toPickedTemplate(functionItem.template));
    },
    [closeTooltips, onSelectTemplate]
  );

  const renderFunctionButton = useCallback(
    (functionItem: FunctionTemplateItem) => {
      const isAccessible = functionItem.template.isAccessible;

      if (!isAccessible) {
        return (
          <Tooltip key={functionItem.key} title={t("task-create.template-inaccessible-tooltip")}>
            <span>
              <Button size="small" className={styles.functionButton} disabled>
                {functionItem.displayName}
              </Button>
            </span>
          </Tooltip>
        );
      }

      return (
        <Tooltip
          key={`${functionItem.key}-${resetCounter}`}
          title={
            <FunctionTemplateTooltip
              displayName={functionItem.displayName}
              isLoading={Boolean(loadingByFunction[functionItem.fun])}
              data={tooltipByFunction[functionItem.fun]}
            />
          }
          mouseEnterDelay={0.45}
          onOpenChange={(isTooltipOpen) => {
            if (isTooltipOpen) {
              loadTooltip(functionItem.fun);
            }
          }}
          classNames={{ root: styles.tooltip }}
          destroyOnHidden
        >
          <Button
            size="small"
            className={styles.functionButton}
            onClick={() => handleSelect(functionItem)}
          >
            {functionItem.displayName}
          </Button>
        </Tooltip>
      );
    },
    [handleSelect, loadTooltip, loadingByFunction, resetCounter, t, tooltipByFunction]
  );

  const columns = useMemo<ColumnsType<FunctionModuleRow>>(
    () => [
      {
        title: t("job-function-select.table-module"),
        dataIndex: "moduleName",
        key: "moduleName",
        width: "35%",
        render: (_, moduleRow) => (
          <div className={styles.moduleCell}>
            <span className={styles.moduleTitle}>{moduleRow.moduleName}</span>
            <span className={styles.moduleDescription}>{moduleRow.description}</span>
          </div>
        ),
      },
      {
        title: t("job-function-select.table-functions"),
        dataIndex: "functions",
        key: "functions",
        render: (_, moduleRow) => (
          <div className={styles.functionsCell}>
            {moduleRow.functions.map(renderFunctionButton)}
          </div>
        ),
      },
    ],
    [renderFunctionButton, t]
  );

  if (isAccessibilityLoading) {
    return <TemplateListPanelSkeleton />;
  }

  return (
    <>
      {hasAccessibilityError && (
        <Alert
          type="error"
          message={t("task-create.error-loading-template-accessibility")}
          showIcon
        />
      )}

      <Table
        className={styles.functionsTable}
        columns={columns}
        dataSource={moduleRows}
        pagination={false}
        size="small"
      />
    </>
  );
}
