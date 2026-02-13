import { SaltboxCorePillarsOldSchemasPillarSchemasPillarModel } from "@saltbox/saltbox-core-api-client";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { SortingState, createColumnHelper } from "@tanstack/react-table";
import React, { useState } from "react";

import styles from "./minion-pillars-tab.module.css";

const columnHelper = createColumnHelper<SaltboxCorePillarsOldSchemasPillarSchemasPillarModel>();

const pillarsColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("value", {
    header: "Value",
  }),
];

interface MinionPillarsTabProps {
  pillars: SaltboxCorePillarsOldSchemasPillarSchemasPillarModel[] | null;
  isPillarsLoading: boolean;
  isFullView?: boolean;
  pillarsTabActions?: React.ReactNode;
}

export function MinionPillarsTab({
  pillars,
  isPillarsLoading,
  isFullView = false,
  pillarsTabActions,
}: MinionPillarsTabProps) {
  const pillarsData = pillars ?? [];
  const pillarsTotal = pillars?.length ?? 0;
  const [sorting, setSorting] = useState<SortingState>([]);

  return (
    <div className={styles.pillarsTabContent}>
      {isFullView && pillarsTabActions ? (
        <div className="page-actions-buttons">{pillarsTabActions}</div>
      ) : null}
      <FastTableListed
        isLoading={isPillarsLoading}
        columns={pillarsColumns}
        data={pillarsData}
        total={pillarsTotal}
        isEmpty={!pillarsData.length}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.name}
      />
    </div>
  );
}
