import { DeleteOutlined } from "@ant-design/icons";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { MinionStore } from "saltbox-core/store";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, messageContextHolder] = message.useMessage();

  const minionStore = useMemo(() => new MinionStore(slug ?? "", minionId ?? ""), [slug, minionId]);

  useEffect(() => {
    if (minionStore.error) {
      navigate("/core/not-found");
    }
  }, [minionStore.error]);

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

  return (
    <>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <MinionDetails
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
