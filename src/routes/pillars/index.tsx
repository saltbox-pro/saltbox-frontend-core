import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreatePillar } from "saltbox-core/features/pillar/create-pillar";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { PillarsStore } from "saltbox-core/store";

function PillarsPage() {
  const { t } = useTranslation();

  const [pillarsStore] = useState(() => new PillarsStore());

  useEffect(() => {
    pillarsStore.loadPillars();

    return () => {
      pillarsStore.reset();
    };
  }, [pillarsStore]);

  return (
    <>
      <PageHeader title={t("pillars.title")} />

      <div className="page-actions-buttons">
        <CreatePillar
          targetType={PillarTgtType.Root}
          loadPillars={pillarsStore.reloadFromFirstPage}
        />
      </div>

      <PillarsTable store={pillarsStore} />
    </>
  );
}

export default observer(PillarsPage);
