import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useParams,
} from "react-router";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header";
import { CollectionStore } from "saltbox-core/store";
import { MinionStore } from "saltbox-core/store";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const [minionStore] = useState(new MinionStore(slug, minionId));
  const [collectionStore] = useState(new CollectionStore());

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
  }, [slug]);

  useEffect(() => {
    if (minionStore.error) {
      navigate("/not-found");
    }
  }, [minionStore.error]);

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
            href: `/minions/${slug}`,
          },
          {
            title: `${t("minions.minion")} #${minionStore.minion?.minion_id}`,
          },
        ]}
      />
      <PageHeader
        title={`${t("minions.minion")} #${minionStore.minion?.minion_id}`}
      />

      <div className="filters-actions-buttons">
        <JobModal
          target={minionStore.minion?.minion_id ?? ""}
          targetType="glob"
        />
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