import { DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Dropdown, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { ActionButtonWithTooltip } from "saltbox-core/shared/components/action-button-with-tooltip";

import { useDeleteExtraDataCategoryConfirm } from "../hooks/use-delete-extra-data-category-confirm";

type ExtraDataCategoryActionsMenuProps = {
  category: ExtraDataCategoryModel | null;
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

  const canManage = !!category && !category.is_system;

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
        <Dropdown menu={{ items }} trigger={["click"]}>
          <Button icon={<SettingOutlined />} />
        </Dropdown>
      ) : (
        <ActionButtonWithTooltip
          disabled
          title={
            category?.is_system ? t("extra-data-categories.system-category-readonly") : undefined
          }
        >
          <Button icon={<SettingOutlined />} disabled />
        </ActionButtonWithTooltip>
      )}
      {deleteConfirm.modalContextHolder}
    </>
  );
}
