import { Alert } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceTemplatesList } from "saltbox-core/features/template-source-ui";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";
import type { SelectedTaskTemplate, TaskTemplatePickerItem } from "../../../type/types";

import { useTemplateListCollapseActiveKeys } from "./template-list-collapse-active-keys-context";
import { TemplateListPanelSkeleton } from "./template-list-panel-skeleton";

export type TemplateListSourcePanelProps = {
  sourceRow: TemplateSourceRow;
  searchQuery?: string;
  onSelectTemplate: (template: SelectedTaskTemplate) => void;
};

export function TemplateListSourcePanel({
  sourceRow,
  searchQuery,
  onSelectTemplate,
}: TemplateListSourcePanelProps) {
  const { t } = useTranslation();
  const activeKeys = useTemplateListCollapseActiveKeys();
  const isPanelExpanded = activeKeys.includes(sourceRow.key);
  const showSkeleton =
    isPanelExpanded && !sourceRow.isAccessibilityLoaded && !sourceRow.isAccessibilityError;

  const getTemplateAccessibility = useCallback(
    (template: TaskTemplatePickerItem) => ({
      isAccessible: template.isAccessible,
      tagLabel: template.isAccessible
        ? t("task-create.template-accessible")
        : t("task-create.template-inaccessible"),
      disabledTitle: template.isAccessible
        ? undefined
        : t("task-create.template-inaccessible-tooltip"),
    }),
    [t]
  );

  const handleTemplateClick = useCallback(
    (template: TaskTemplatePickerItem) => {
      if (!sourceRow.isAccessibilityLoaded || !template.isAccessible) {
        return;
      }

      onSelectTemplate({
        sourceId: template.source_id,
        templateId: template.id,
      });
    },
    [onSelectTemplate, sourceRow.isAccessibilityLoaded]
  );

  if (showSkeleton) {
    return <TemplateListPanelSkeleton />;
  }

  if (sourceRow.isAccessibilityError) {
    return (
      <Alert
        type="error"
        message={t("task-create.error-loading-template-accessibility")}
        showIcon
      />
    );
  }

  return (
    <TemplateSourceTemplatesList<TaskTemplatePickerItem>
      items={sourceRow.templates}
      constrainHeight={false}
      searchQuery={searchQuery}
      getTemplateAccessibility={
        sourceRow.isAccessibilityLoaded ? getTemplateAccessibility : undefined
      }
      onTemplateClick={handleTemplateClick}
    />
  );
}
