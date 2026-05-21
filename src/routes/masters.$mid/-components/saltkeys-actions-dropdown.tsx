import { ActionDropdown } from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { RowSelectionState } from "@tanstack/react-table";

type SaltKeysActionsDropdownProps = {
  selectedSaltKeys: RowSelectionState;
  isSendingAction: boolean;
  onAcceptSelected?: () => void;
  onRejectSelected?: () => void;
  onDeleteSelected?: () => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onDeleteAll?: () => void;
};

export function SaltKeysActionsDropdown({
  selectedSaltKeys,
  isSendingAction,
  onAcceptSelected,
  onRejectSelected,
  onDeleteSelected,
  onAcceptAll,
  onRejectAll,
  onDeleteAll,
}: SaltKeysActionsDropdownProps) {
  const { t } = useTranslation();

  const items = useMemo(() => {
    if (Object.keys(selectedSaltKeys).length > 0) {
      return [
        {
          key: "accept-selected",
          label: t("master.action-accept-selected-label"),
          icon: <CheckOutlined />,
          onClick: () => onAcceptSelected?.(),
        },
        {
          key: "reject-selected",
          label: t("master.action-reject-selected-label"),
          icon: <CloseOutlined />,
          onClick: () => onRejectSelected?.(),
        },
        {
          key: "delete-selected",
          label: t("master.action-delete-selected-label"),
          icon: <DeleteOutlined />,
          onClick: () => onDeleteSelected?.(),
        },
      ];
    } else {
      return [
        {
          key: "accept-all",
          label: t("master.action-accept-all-label"),
          icon: <CheckOutlined />,
          onClick: () => onAcceptAll?.(),
        },
        {
          key: "reject-all",
          label: t("master.action-reject-all-label"),
          icon: <CloseOutlined />,
          onClick: () => onRejectAll?.(),
        },
        {
          key: "delete-all",
          label: t("master.action-delete-all-label"),
          icon: <DeleteOutlined />,
          onClick: () => onDeleteAll?.(),
        },
      ];
    }
  }, [
    t,
    selectedSaltKeys,
    onAcceptSelected,
    onRejectSelected,
    onDeleteSelected,
    onAcceptAll,
    onRejectAll,
    onDeleteAll,
  ]);

  return <ActionDropdown menu={{ items }} disabled={isSendingAction} />;
}
