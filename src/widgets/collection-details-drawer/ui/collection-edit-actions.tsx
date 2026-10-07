import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "saltbox-core/shared/components/action-button-with-tooltip";

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

  return (
    <Flex gap="small">
      <Button onClick={onReset} disabled={!hasUnsavedChanges || isSaving}>
        {t("common.reset")}
      </Button>
      <ActionButtonWithTooltip disabled={!hasUnsavedChanges} title={t("common.no-changes-to-save")}>
        <Button type="primary" onClick={onSave} loading={isSaving} disabled={!hasUnsavedChanges}>
          {t("common.save")}
        </Button>
      </ActionButtonWithTooltip>
    </Flex>
  );
}
