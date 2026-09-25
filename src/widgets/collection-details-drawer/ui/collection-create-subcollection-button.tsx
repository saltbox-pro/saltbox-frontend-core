import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "./action-button-with-tooltip";

interface CollectionCreateSubcollectionButtonProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onClick: () => void;
}

export function CollectionCreateSubcollectionButton({
  hasUnsavedChanges,
  isSaving,
  onClick,
}: CollectionCreateSubcollectionButtonProps) {
  const { t } = useTranslation();

  return (
    <ActionButtonWithTooltip
      disabled={hasUnsavedChanges}
      title={t("collection.tooltip-create-subcollection-blocked")}
    >
      <Button icon={<PlusOutlined />} disabled={hasUnsavedChanges || isSaving} onClick={onClick}>
        {t("collection.create-subcollection")}
      </Button>
    </ActionButtonWithTooltip>
  );
}
