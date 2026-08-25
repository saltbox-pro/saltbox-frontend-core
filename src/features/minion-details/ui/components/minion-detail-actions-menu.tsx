import { DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { Button, Dropdown, Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";

import { buildMinionDetailActionPluginItems } from "../../helpers/build-minion-detail-action-plugin-items";
import { useMinionDetailActionsTick } from "../../hooks/use-minion-detail-actions-tick";

export interface MinionDetailActionsMenuProps {
  minion: MinionDetailSchema | null;
  collectionSlug: string | null | undefined;
  /** Mongo id, если ещё нет в minion (например из URL полной страницы). */
  minionMongoId?: string;
  onDeleted?: () => void;
}

export const MinionDetailActionsMenu = observer(function MinionDetailActionsMenu({
  minion,
  collectionSlug,
  minionMongoId,
  onDeleted,
}: MinionDetailActionsMenuProps) {
  const { t } = useTranslation();
  const [messageApi, messageContextHolder] = message.useMessage();
  useMinionDetailActionsTick();

  const resolvedMongoId = minion?.id ?? minionMongoId ?? "";
  const resolvedDisplayId = minion?.minion_id;

  const removeMinion = useRemoveMinionConfirm({
    collectionSlug: collectionSlug ?? "",
    minionMongoId: resolvedMongoId,
    minionDisplayId: resolvedDisplayId,
    messageApi,
    onDeleted,
  });

  const actionContext = useMemo(() => {
    if (!minion) {
      return null;
    }
    return {
      minionId: minion.minion_id,
      saltMaster: minion.master,
    };
  }, [minion]);

  const pluginActionItems = buildMinionDetailActionPluginItems(actionContext);
  const canDelete = Boolean(minion && collectionSlug && resolvedMongoId);
  const items: NonNullable<MenuProps["items"]> = [
    ...pluginActionItems,
    ...(pluginActionItems.length > 0 ? [{ type: "divider" as const }] : []),
    {
      key: "delete-minion",
      label: (
        <Flex align="center" gap={8}>
          <DeleteOutlined />
          {t("minions.delete")}
        </Flex>
      ),
      danger: true,
      onClick: removeMinion.openConfirm,
      disabled: !canDelete,
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <Button>
          <Flex gap={8} align="center">
            <SettingOutlined />
          </Flex>
        </Button>
      </Dropdown>
      {removeMinion.modalContextHolder}
      {messageContextHolder}
    </>
  );
});
