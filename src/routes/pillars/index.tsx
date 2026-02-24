import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PillarsStore } from "saltbox-core/store";

import { PillarsTable } from "saltbox-core/shared/components/pillars/table";

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

      <PillarsTable store={pillarsStore} />
    </>
  );
}

export default observer(PillarsPage);
