import { ExportOutlined } from "@ant-design/icons";
import { type TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, RelativeTime } from "@saltbox/saltbox-frontend-common";
import { type PaginationState, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";

const TaskMinionsTable = FastTablePaginated<TaskMinionModel>;
const columnHelper = createColumnHelper<TaskMinionModel>();

export const TaskMinions = ({
  minions,
  total,
  collectionSlug,
  isLoading,
  pagination,
  sorting,
  onLazyLoad,
  onMinionClick,
}: {
  minions: TaskMinionModel[];
  total: number;
  collectionSlug: string;
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
  onMinionClick?: (minion: TaskMinionModel) => void;
}) => {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      columnHelper.accessor("minion_id", {
        header: t("task.minions.table-minion-id"),
        meta: {
          showCopy: true,
          copyValue: (row: TaskMinionModel) => row.minion_id ?? "",
          actions: [
            {
              icon: <ExportOutlined />,
              onClick: (_, row) => {
                const mid = row.minion_inner_id ?? "";
                if (collectionSlug && mid) {
                  window.open(`/core/minions/${collectionSlug}/${mid}`, "_blank");
                }
              },
              title: t("minions.open-in-new-tab"),
              visible: (_, row) => !!(collectionSlug && row.minion_inner_id),
            },
          ],
          color: "accent",
          width: 400,
          minWidth: 300,
          maxWidth: 400,
          ellipsis: true,
        },
      }),
      columnHelper.accessor("master", {
        header: t("task.minions.table-master"),
      }),
      columnHelper.accessor("status", {
        header: t("task.minions.table-status"),
        cell: (data) => <MinionTaskStatus status={data.getValue()} />,
        meta: { width: 150 },
      }),
      columnHelper.accessor("count_runs", {
        header: t("task.minions.table-count-runs"),
        meta: { width: 200 },
      }),
      columnHelper.accessor("start_last_dt", {
        header: t("task.minions.table-started"),
        cell: (data) => (
          <RelativeTime
            date={data.getValue()}
            fallback={<>{t("task.minions.table-not-started")}</>}
          />
        ),
        meta: { width: "18%" },
      }),
      columnHelper.accessor("finished_dt", {
        header: t("task.minions.table-finished"),
        cell: (data) => (
          <RelativeTime
            date={data.getValue()}
            fallback={<>{t("task.minions.table-not-started")}</>}
          />
        ),
        meta: { width: "18%" },
      }),
    ],
    [collectionSlug, t]
  );

  return (
    <TaskMinionsTable
      columns={columns}
      getRowId={(row) => row.id}
      data={minions}
      total={total}
      isLoading={isLoading}
      pagination={pagination}
      sorting={sorting}
      onLazyLoad={onLazyLoad}
      onRowClick={(minion) => onMinionClick?.(toJS(minion))}
      useVirtualScroll={false}
    />
  );
};
