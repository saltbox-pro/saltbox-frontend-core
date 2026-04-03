import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreatePillar } from "saltbox-core/features/pillar/create-pillar";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { PillarsStore } from "saltbox-core/store";

function PillarsPage() {
  const { t } = useTranslation();

  const [pillarsStore] = useState(() => new PillarsStore());

  const { addPillarButton, createPillarModal } = useCreatePillar({
    store: pillarsStore,
    targetType: PillarTgtType.Root,
  });

  useEffect(() => {
    pillarsStore.loadPillars();

    return () => {
      pillarsStore.reset();
    };
  }, [pillarsStore]);

  return (
    <>
      <PageHeader title={t("pillars.title")} />

      <div className="page-actions-buttons">{addPillarButton}</div>

      <PillarsTable store={pillarsStore} />

      {createPillarModal}
    </>
  );
}

export default observer(PillarsPage);
