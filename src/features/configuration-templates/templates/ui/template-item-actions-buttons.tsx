import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { BaseActionButton } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import type { SourceTemplateActionsPermissions } from "../helpers/source-template-actions";

export type TemplateItemActionsButtonsProps = {
  permissions: SourceTemplateActionsPermissions;
  showDelete?: boolean;
  isDeleting?: boolean;
  isDeleteBlocked?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  stopPropagation?: boolean;
};

export function TemplateItemActionsButtons({
  permissions,
  showDelete = true,
  isDeleting = false,
  isDeleteBlocked = false,
  onEdit,
  onDuplicate,
  onDelete,
  stopPropagation = false,
}: TemplateItemActionsButtonsProps) {
  const { t } = useTranslation();

  const wrapHandler = (handler: () => void) => (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    handler();
  };

  return (
    <Flex align="center" gap={4}>
      {permissions.showEdit && (
        <BaseActionButton
          icon={<EditOutlined />}
          title={t("configuration-templates.source.edit-template")}
          disabled={!permissions.canEdit}
          onClick={wrapHandler(onEdit)}
        />
      )}

      {permissions.showDuplicate && (
        <BaseActionButton
          icon={<CopyOutlined />}
          title={t("configuration-templates.source.duplicate-template")}
          disabled={!permissions.canDuplicate}
          onClick={wrapHandler(onDuplicate)}
        />
      )}

      {showDelete && permissions.showDelete && (
        <BaseActionButton
          color="danger"
          icon={<DeleteOutlined />}
          title={t("configuration-templates.source.delete-template")}
          loading={isDeleting}
          disabled={!permissions.canDelete || isDeleteBlocked}
          onClick={wrapHandler(onDelete)}
        />
      )}
    </Flex>
  );
}
