import { ExportOutlined, IssuesCloseOutlined } from "@ant-design/icons";
import { type TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, RelativeTime } from "@saltbox/saltbox-frontend-common";
import { type PaginationState, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { message } from "antd";
import { toJS } from "mobx";
import { useCallback, useMemo } from "react";
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
  onRestartFailedMinion,
}: {
  minions: TaskMinionModel[];
  total: number;
  collectionSlug: string;
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
  onMinionClick?: (minion: TaskMinionModel) => void;
  onRestartFailedMinion?: (minionInnerId: string) => Promise<void>;
}) => {
  const { t } = useTranslation();

  const handleRestartFailedMinionClick = useCallback(
    async (minionInnerId: string | null | undefined, minionId: string | null | undefined) => {
      if (!onRestartFailedMinion || !minionInnerId) {
        return;
      }

      const displayId = minionId ?? minionInnerId;

      try {
        await onRestartFailedMinion(minionInnerId);
      } catch {
        message.error(
          t("task.restart-failed-minion-error", {
            minionId: displayId,
          })
        );
      }
    },
    [onRestartFailedMinion, t]
  );

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
            {
              icon: <IssuesCloseOutlined />,
              title: t("task.restart-failed-minion"),
              visible: (_, row) =>
                row.status === TaskMinionStatus.Failed && !!onRestartFailedMinion,
              onClick: async (_, row) => {
                await handleRestartFailedMinionClick(row.minion_inner_id, row.minion_id);
              },
              buttonProps: {
                color: "orange",
                variant: "solid",
              },
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
        meta: { width: 125 },
      }),
      columnHelper.accessor("count_runs", {
        header: t("task.minions.table-count-runs"),
        meta: { width: 205 },
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
    [collectionSlug, handleRestartFailedMinionClick, onRestartFailedMinion, t]
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
