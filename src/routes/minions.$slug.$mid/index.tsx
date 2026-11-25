import { ErrorZone, PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import {
  MinionDetailActionsMenu,
  MinionDetailsFullPage,
  useOnMinionDataRefreshed,
} from "saltbox-core/features/minion-details";
import { MinionStore } from "saltbox-core/store";

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();

  const minionStore = useMemo(() => new MinionStore(slug ?? "", minionId ?? ""), [slug, minionId]);

  useOnMinionDataRefreshed(
    minionStore.minion?.minion_id,
    () => {
      minionStore.refreshMinion();
    },
    { queueWhenUnset: true }
  );

  return (
    <>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <ErrorZone
        level="page"
        loaders={[minionStore.minionLoad]}
        onNavigateHome={() => navigate(`/core/minions/${slug}`)}
      >
        <MinionDetailsFullPage
          isFullView
          minion={minionStore.minion}
          isMinionLoading={minionStore.isMinionLoading}
          isMinionRefreshing={minionStore.isMinionRefreshing}
          collectionSlug={slug ?? ""}
          actionsMenu={
            <MinionDetailActionsMenu
              minion={minionStore.minion}
              collectionSlug={slug}
              minionMongoId={minionId}
              onDeleted={() => {
                navigate(`/core/minions/${slug}`);
              }}
            />
          }
        />
      </ErrorZone>
    </>
  );
});

export default MinionPage;
