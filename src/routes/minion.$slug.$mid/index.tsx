import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Popconfirm, message } from "antd";
import { HomeOutlined, DeleteOutlined } from "@ant-design/icons";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { CollectionStore, MinionStore } from "saltbox-core/store";
import { apiCoreStore } from "saltbox-core/store/api-core-store";

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
      message.success(t("minions.deleted-successfully"));
      navigate(`/minions/${slug}`);
    } catch (error) {
      message.error(t("minions.delete-failed"));
      console.error("Failed to delete minion:", error);
    }
  }, [minionId, slug, navigate, t]);

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
        <JobModal
          target={minionStore.minion?.minion_id ?? ""}
          targetType="glob"
        />
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
    </>
  );
});

export default MinionPage;
