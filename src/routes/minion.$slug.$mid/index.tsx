import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Popconfirm, message, Modal } from "antd";
import { HomeOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { CollectionStore, MinionStore } from "saltbox-core/store";
import { apiCoreStore } from "saltbox-core/store/api-core-store";
import { PillarCreateForm } from "./-components/pillar-create-form";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const minionStoreRef = useRef<MinionStore | undefined>(undefined);
  if (!minionStoreRef.current) {
    minionStoreRef.current = new MinionStore(slug, minionId);
  }
  const minionStore: MinionStore = minionStoreRef.current;
  const [collectionStore] = useState(new CollectionStore());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
  }, [slug]);

  useEffect(() => {
    if (minionStore.error) {
      navigate("/not-found");
    }
  }, [minionStore.error]);

  const handleDeleteMinion = useCallback(async () => {
    if (!minionId || !slug) return;

    try {
      await apiCoreStore.minionsApi?.minionDelete({
        mid: minionId,
        collection_slug: slug,
      });
      messageApi.success(t("minions.deleted-successfully"));
      navigate(`/minions/${slug}`);
    } catch (error) {
      messageApi.error(t("minions.delete-failed"));
      console.error("Failed to delete minion:", error);
    }
  }, [minionId, slug, messageApi, t, navigate]);

  const handleCreatePillar = useCallback(
    async (values: { name: string; value: string }) => {
      if (!minionStore.minion?.master || !minionStore.minion?.minion_id) {
        messageApi.error(t("pillars.select-master-error"));
        return false;
      }

      try {
        await apiCoreStore.pillarsApi?.pillarCreate({
          PillarModel: {
            master_id: minionStore.minion.master,
            minion_id: minionStore.minion.minion_id,
            name: values.name,
            value: values.value,
          },
        });
        setIsCreateModalOpen(false);
        messageApi.success(t("pillars.create-success"));
        minionStore.loadPillars();
        return true;
      } catch (error) {
        messageApi.error(t("pillars.create-error"));
        return false;
      }
    },
    [minionStore, messageApi, t]
  );

  return (
    <>
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("minions.title"),
          },
          {
            title: collectionStore.collection?.title ?? "",
            href: `/core/minions/${slug}`,
          },
          {
            title: `${t("minions.minion")} #${minionStore.minion?.minion_id}`,
          },
        ]}
      />
      <PageHeader
        title={`${t("minions.minion")} #${minionStore.minion?.minion_id}`}
      />

      <div
        className="page-actions-buttons"
        style={{ justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <JobModal
            target={minionStore.minion?.minion_id ?? ""}
            targetType="glob"
            defaultMaster={minionStore.minion?.master ?? ""}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!minionStore.minion}
          >
            {t("pillars.create-pillar")}
          </Button>
        </div>
        <Popconfirm
          title={t("minions.delete-confirm-title")}
          description={t("minions.delete-confirm-description")}
          onConfirm={handleDeleteMinion}
          okText={t("common.yes")}
          cancelText={t("common.no")}
          placement="topRight"
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            disabled={!minionStore.minion}
          />
        </Popconfirm>
      </div>

      <MinionDetails
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        pillars={minionStore.pillars}
        isPillarsLoading={minionStore.isPillarsLoading}
      />

      {isCreateModalOpen && (
        <Modal
          title={t("pillars.create-pillar-modal-title")}
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          closable={false}
        >
          <PillarCreateForm
            onSubmit={handleCreatePillar}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      )}
      {contextHolder}
    </>
  );
});

export default MinionPage;
