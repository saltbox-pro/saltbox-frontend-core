import { DeleteOutlined } from "@ant-design/icons";
import { HttpErrorPage, PageHeader } from "@saltbox/saltbox-frontend-common";
import { Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { MinionDetailsFullPage } from "saltbox-core/features/minion-details";
import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";
import { MinionStore } from "saltbox-core/store";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();

  const minionStore = useMemo(() => new MinionStore(slug ?? "", minionId ?? ""), [slug, minionId]);

  const removeMinion = useRemoveMinionConfirm({
    collectionSlug: slug ?? "",
    minionMongoId: minionId ?? "",
    minionDisplayId: minionStore.minion?.minion_id,
    messageApi,
    onDeleted: () => {
      navigate(`/core/minions/${slug}`);
    },
  });

  const minionsActionsMenuItems: MenuProps["items"] = [
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

  if (minionStore.loadError) {
    return (
      <HttpErrorPage
        error={minionStore.loadError}
        homePath="/core/minions"
        onRetry={() => minionStore.loadMinion()}
      />
    );
  }

  return (
    <>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <MinionDetailsFullPage
        isFullView
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        fullViewActionsMenuItems={minionsActionsMenuItems}
      />

      {removeMinion.modalContextHolder}
      {messageContextHolder}
    </>
  );
});

export default MinionPage;
