import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "./action-button-with-tooltip";

interface CollectionEditActionsProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function CollectionEditActions({
  hasUnsavedChanges,
  isSaving,
  onReset,
  onSave,
}: CollectionEditActionsProps) {
  const { t } = useTranslation();
  const noChangesTooltip = t("collection.tooltip-no-changes");

  return (
    <Flex gap="small">
      <ActionButtonWithTooltip disabled={!hasUnsavedChanges} title={noChangesTooltip}>
        <Button onClick={onReset} disabled={!hasUnsavedChanges || isSaving}>
          {t("collection.reset-changes")}
        </Button>
      </ActionButtonWithTooltip>
      <ActionButtonWithTooltip disabled={!hasUnsavedChanges} title={noChangesTooltip}>
        <Button type="primary" onClick={onSave} loading={isSaving} disabled={!hasUnsavedChanges}>
          {t("common.save")}
        </Button>
      </ActionButtonWithTooltip>
    </Flex>
  );
}
