import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { FastTable, PageHeader } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { CreatePillar } from "saltbox-core/features/pillar/create-pillar";
import { PillarsQueryBuilder } from "saltbox-core/shared/components/pillars/pillars-query-builder";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { getPillarsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { PillarsFilterStore, PillarsStore } from "saltbox-core/store";

function PillarsPage() {
  const { t } = useTranslation();
  const location = useLocation();

  const [pillarsStore] = useState(() => new PillarsStore());
  const [filterStore] = useState(
    () => new PillarsFilterStore([], `pillarsFilter:${location.pathname}`)
  );

  const filterSchema = useMemo(() => getPillarsFilterSchema(t), [t]);

  useEffect(() => {
    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);

  useEffect(() => {
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    pillarsStore.loadPillars();

    return () => {
      pillarsStore.reset();
    };
  }, [filterStore, pillarsStore]);

  const handleSearchButtonClick = () => {
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    pillarsStore.reloadFromFirstPage();
  };

  const handleResetButtonClick = () => {
    filterStore.handleResetFilters();
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    pillarsStore.reloadFromFirstPage();
  };

  return (
    <>
      <PageHeader title={t("pillars.title")} />

      <PillarsQueryBuilder
        filterStore={filterStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
      />

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <CreatePillar
            targetType={PillarTgtType.Root}
            loadPillars={pillarsStore.reloadFromFirstPage}
          />
          <FastTable.Toolbar />
        </div>

        <PillarsTable store={pillarsStore} tableId="core-pillars" />
      </FastTable.Provider>
    </>
  );
}

export default observer(PillarsPage);
