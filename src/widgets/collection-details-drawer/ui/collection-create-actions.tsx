import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "./action-button-with-tooltip";

interface CollectionCreateActionsProps {
  hasUnsavedChanges: boolean;
  isCreating: boolean;
  onReset: () => void;
  onCreate: () => void;
}

export function CollectionCreateActions({
  hasUnsavedChanges,
  isCreating,
  onReset,
  onCreate,
}: CollectionCreateActionsProps) {
  const { t } = useTranslation();
  const noChangesTooltip = t("collection.tooltip-no-changes");

  return (
    <Flex gap="small">
      <ActionButtonWithTooltip disabled={!hasUnsavedChanges} title={noChangesTooltip}>
        <Button onClick={onReset} disabled={!hasUnsavedChanges || isCreating}>
          {t("collection.reset-changes")}
        </Button>
      </ActionButtonWithTooltip>
      <Button type="primary" onClick={onCreate} loading={isCreating}>
        {t("collection-create-modal.create")}
      </Button>
    </Flex>
  );
}
