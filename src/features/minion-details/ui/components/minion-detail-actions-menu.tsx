import { DeleteOutlined } from "@ant-design/icons";
import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  type ActionDropdownItem,
  SettingsDropdown,
  UiEvent,
} from "@saltbox/saltbox-frontend-common";
import { Flex, message } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";
import {
  buildMinionDetailActionPluginItems,
  useActionPluginClickGuard,
  usePluginActionsTick,
} from "saltbox-core/features/plugins";

export interface MinionDetailActionsMenuProps {
  minion: MinionDetailSchema | null;
  collectionSlug: string | null | undefined;
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
  const actionPluginClickGuard = useActionPluginClickGuard(messageApi);
  usePluginActionsTick(UiEvent.MinionDetailActionsChanged);

  const resolvedMongoId = minion?.id ?? minionMongoId ?? "";
  const resolvedDisplayId = minion?.minion_id;

  const removeMinion = useRemoveMinionConfirm({
    collectionSlug: collectionSlug ?? "",
    minionMongoId: resolvedMongoId,
    minionDisplayId: resolvedDisplayId,
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

  const pluginActionItems = buildMinionDetailActionPluginItems(
    actionContext,
    actionPluginClickGuard
  );
  const canDelete = Boolean(minion && collectionSlug && resolvedMongoId);

  const items: ActionDropdownItem[] = [...pluginActionItems];
  if (pluginActionItems.length > 0) {
    items.push({ type: "divider" });
  }
  items.push({
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
  });

  return (
    <>
      <SettingsDropdown menu={{ items }} />
      {removeMinion.modalContextHolder}
      {messageContextHolder}
    </>
  );
});
