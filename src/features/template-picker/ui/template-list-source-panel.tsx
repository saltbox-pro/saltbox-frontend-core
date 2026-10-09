import { ErrorZone, type LoadSource } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceTemplatesList } from "saltbox-core/features/template-source-ui";

import { toPickedTemplate } from "../helpers/template-kind";
import type { TemplateSourceRow } from "../helpers/template-picker-rows";
import type { PickedTemplate, TaskTemplatePickerItem } from "../type/types";

import { TemplateItemTags } from "./template-item-tags";
import { useTemplateListCollapseActiveKeys } from "./template-list-collapse-active-keys-context";
import { TemplateListPanelSkeleton } from "./template-list-panel-skeleton";

export type TemplateListSourcePanelProps = {
  sourceRow: TemplateSourceRow;
  searchQuery?: string;
  getAccessibilityLoad: (sourceId: string) => LoadSource;
  onSelectTemplate: (template: PickedTemplate) => void;
};

export const TemplateListSourcePanel = observer(function TemplateListSourcePanel({
  sourceRow,
  searchQuery,
  getAccessibilityLoad,
  onSelectTemplate,
}: TemplateListSourcePanelProps) {
  const { t } = useTranslation();
  const activeKeys = useTemplateListCollapseActiveKeys();
  const accessibilityLoad = getAccessibilityLoad(sourceRow.key);
  const isPanelExpanded = activeKeys.includes(sourceRow.key);
  const showSkeleton = isPanelExpanded && !sourceRow.isAccessibilityLoaded;

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

      onSelectTemplate(toPickedTemplate(template));
    },
    [onSelectTemplate, sourceRow.isAccessibilityLoaded]
  );

  return (
    <ErrorZone level="block" loaders={[accessibilityLoad]}>
      {showSkeleton ? (
        <TemplateListPanelSkeleton />
      ) : (
        <TemplateSourceTemplatesList<TaskTemplatePickerItem>
          items={sourceRow.templates}
          constrainHeight={false}
          searchQuery={searchQuery}
          renderTags={(template) => (
            <TemplateItemTags template={template} searchQuery={searchQuery} />
          )}
          getTemplateAccessibility={
            sourceRow.isAccessibilityLoaded ? getTemplateAccessibility : undefined
          }
          onTemplateClick={handleTemplateClick}
        />
      )}
    </ErrorZone>
  );
});
