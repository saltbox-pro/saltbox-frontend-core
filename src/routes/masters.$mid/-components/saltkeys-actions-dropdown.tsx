import { CheckOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { ActionDropdown } from "@saltbox/saltbox-frontend-common";
import type { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type SaltKeysActionsDropdownProps = {
  selectedSaltKeys: RowSelectionState;
  isSendingAction: boolean;
  unacceptedCount: number;
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
  unacceptedCount,
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
          danger: true,
          onClick: () => onDeleteSelected?.(),
        },
      ];
    } else {
      const allItems = [];

      if (unacceptedCount > 0) {
        allItems.push({
          key: "accept-all",
          label: t("master.action-accept-all-label"),
          icon: <CheckOutlined />,
          onClick: () => onAcceptAll?.(),
        });
        allItems.push({
          key: "reject-all",
          label: t("master.action-reject-all-label"),
          icon: <CloseOutlined />,
          onClick: () => onRejectAll?.(),
        });
      }

      allItems.push({
        key: "delete-all",
        label: t("master.action-delete-all-label"),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDeleteAll?.(),
      });

      return allItems;
    }
  }, [
    t,
    selectedSaltKeys,
    unacceptedCount,
    onAcceptSelected,
    onRejectSelected,
    onDeleteSelected,
    onAcceptAll,
    onRejectAll,
    onDeleteAll,
  ]);

  return <ActionDropdown menu={{ items }} disabled={isSendingAction} />;
}
