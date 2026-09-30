import { DeleteOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type ActionDropdownItem, SettingsDropdown } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "saltbox-core/shared/components/action-button-with-tooltip";

import { useDeleteExtraDataCategoryConfirm } from "../hooks/use-delete-extra-data-category-confirm";

type ExtraDataCategoryActionsMenuProps = {
  category: ExtraDataCategoryModel;
  displayName?: string;
  onDeleted?: (category: ExtraDataCategoryModel) => void;
};

export function ExtraDataCategoryActionsMenu({
  category,
  displayName,
  onDeleted,
}: ExtraDataCategoryActionsMenuProps) {
  const { t } = useTranslation();

  const deleteConfirm = useDeleteExtraDataCategoryConfirm({ category, displayName, onDeleted });

  const canManage = !category.is_system;

  const items: ActionDropdownItem[] = [
    {
      key: "delete-category",
      label: (
        <Flex align="center" gap={8}>
          <DeleteOutlined />
          {t("common.delete")}
        </Flex>
      ),
      danger: true,
      onClick: deleteConfirm.openConfirm,
    },
  ];

  return (
    <>
      {canManage ? (
        <SettingsDropdown menu={{ items }} />
      ) : (
        <ActionButtonWithTooltip
          disabled
          title={t("extra-data-categories.system-category-readonly")}
        >
          <SettingsDropdown disabled />
        </ActionButtonWithTooltip>
      )}
      {deleteConfirm.modalContextHolder}
    </>
  );
}
