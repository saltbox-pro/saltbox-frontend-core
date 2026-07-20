import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { FilterToggleButton, useFiltersToggle } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { CreatePillar } from "saltbox-core/features/pillar/create-pillar";
import { PillarsQueryBuilder } from "saltbox-core/shared/components/pillars/pillars-query-builder";
import { PillarsTable } from "saltbox-core/shared/components/pillars/table";
import { getPillarsFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { PillarsFilterStore, PillarsStore } from "saltbox-core/store";

import styles from "./minion-pillars-tab.module.css";

interface MinionPillarsTabProps {
  targetId: string;
  targetName?: string;
  isInDrawer?: boolean;
  isFullView?: boolean;
}

export const MinionPillarsTab = observer(function MinionPillarsTab({
  targetId,
  targetName,
  isInDrawer = false,
  isFullView = false,
}: MinionPillarsTabProps) {
  const { t } = useTranslation();
  const { isOpen: shownFilters, toggle: toggleShownFilters } = useFiltersToggle(false);
  const [filtersExtraContainer, setFiltersExtraContainer] = useState<HTMLElement | null>(null);

  const pillarsStore = useMemo(() => new PillarsStore({ targetId }), [targetId]);

  const filterStore = useMemo(
    () => new PillarsFilterStore([], `pillarsFilter:minion:${targetId}`),
    [targetId]
  );

  const filterSchema = useMemo(() => getPillarsFilterSchema(t, { includeTargetId: false }), [t]);

  const displayName = targetName ?? targetId;

  const { loadPillars, reset } = pillarsStore;

  useEffect(() => {
    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);

  useEffect(() => {
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    loadPillars();

    return () => {
      reset();
    };
  }, [filterStore, loadPillars, pillarsStore, reset]);

  useEffect(() => {
    setFiltersExtraContainer(document.getElementById("minion-pillars-filters-extra"));
  }, []);

  const handlePillarsFilterSearch = useCallback(() => {
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    pillarsStore.reloadFromFirstPage();
  }, [filterStore, pillarsStore]);

  const handlePillarsFilterReset = useCallback(() => {
    filterStore.handleResetFilters();
    pillarsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    pillarsStore.reloadFromFirstPage();
  }, [filterStore, pillarsStore]);

  const pillarsFilterButton =
    isFullView && !isInDrawer ? (
      <FilterToggleButton
        isOpen={shownFilters}
        activeFiltersCount={filterStore.activeFiltersCount}
        onToggle={toggleShownFilters}
      />
    ) : null;

  const pillarsFilter = shownFilters ? (
    <PillarsQueryBuilder
      filterStore={filterStore}
      onSearchButtonClick={handlePillarsFilterSearch}
      onResetButtonClick={handlePillarsFilterReset}
    />
  ) : null;

  return (
    <Flex className={styles.pillarsTabContent} vertical flex={1}>
      {!!filtersExtraContainer &&
        !!pillarsFilterButton &&
        createPortal(pillarsFilterButton, filtersExtraContainer)}

      {!!pillarsFilter && <div className={styles.pillarsFilterWrapper}>{pillarsFilter}</div>}

      <div className="page-actions-buttons">
        <CreatePillar
          targetType={PillarTgtType.Minion}
          tgtId={targetId}
          targetName={displayName}
          loadPillars={pillarsStore.reloadFromFirstPage}
        />
      </div>

      <PillarsTable
        store={pillarsStore}
        tableId={isInDrawer ? "core-minion-pillars-drawer" : "core-minion-pillars"}
        hideTargetColumns
        hideSecretColumn={isInDrawer}
        hideDateColumns={isInDrawer}
      />
    </Flex>
  );
});
