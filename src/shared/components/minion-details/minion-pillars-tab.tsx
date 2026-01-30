import { PillarModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

import styles from "./minion-pillars-tab.module.css";

const columnHelper = createColumnHelper<PillarModel>();

const pillarsColumns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("value", {
    header: "Value",
  }),
];

interface MinionPillarsTabProps {
  pillars: PillarModel[] | null;
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

  return (
    <div className={styles.pillarsTabContent}>
      {isFullView && pillarsTabActions ? (
        <div className="page-actions-buttons">{pillarsTabActions}</div>
      ) : null}
      <FastTablePaginated
        isLoading={isPillarsLoading}
        columns={pillarsColumns}
        data={pillarsData}
        total={pillarsTotal}
        pagination={{ pageSize: 10, pageIndex: 0 }}
        getRowId={(row) => row.name}
        onLazyLoad={() => {}}
      />
    </div>
  );
}
