import { DeleteOutlined } from "@ant-design/icons";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { MinionDetailsFullPage } from "saltbox-core/features/minion-details";
import { buildMinionDetailActionPluginItems } from "saltbox-core/features/minion-details/helpers/build-minion-detail-action-plugin-items";
import { useMinionDetailActionsTick } from "saltbox-core/features/minion-details/hooks/use-minion-detail-actions-tick";
import { useOnMinionDataRefreshed } from "saltbox-core/features/minion-details/hooks/use-on-minion-data-refreshed";
import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";
import { MinionStore } from "saltbox-core/store";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();

  const minionStore = useMemo(() => new MinionStore(slug ?? "", minionId ?? ""), [slug, minionId]);
  useMinionDetailActionsTick();

  useEffect(() => {
    if (minionStore.error) {
      navigate("/core/not-found");
    }
  }, [minionStore.error, navigate]);

  useOnMinionDataRefreshed(
    minionStore.minion?.minion_id,
    () => {
      minionStore.refreshMinion();
    },
    { queueWhenUnset: true }
  );

  const removeMinion = useRemoveMinionConfirm({
    collectionSlug: slug ?? "",
    minionMongoId: minionId ?? "",
    minionDisplayId: minionStore.minion?.minion_id,
    messageApi,
    onDeleted: () => {
      navigate(`/core/minions/${slug}`);
    },
  });

  const actionContext = useMemo(() => {
    if (!minionStore.minion) {
      return null;
    }
    return {
      minionId: minionStore.minion.minion_id,
      saltMaster: minionStore.minion.master,
    };
  }, [minionStore.minion]);

  const pluginActionItems = buildMinionDetailActionPluginItems(actionContext);
  const minionsActionsMenuItems: MenuProps["items"] = [
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
      disabled: !minionStore.minion,
    },
  ];

  return (
    <>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <MinionDetailsFullPage
        isFullView
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        isMinionRefreshing={minionStore.isMinionRefreshing}
        fullViewActionsMenuItems={minionsActionsMenuItems}
      />

      {removeMinion.modalContextHolder}
      {messageContextHolder}
    </>
  );
});

export default MinionPage;
