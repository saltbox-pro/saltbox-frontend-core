import { ExportOutlined, IssuesCloseOutlined } from "@ant-design/icons";
import { type TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, RelativeTime, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";
import type { TaskStore } from "saltbox-core/store";
import { MinionTaskResultsDrawer } from "saltbox-core/widgets/minion-task-results-drawer";
import { useRestartFailedMinionHandler } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

const TaskMinionsTable = FastTablePaginated<TaskMinionModel>;
const columnHelper = createColumnHelper<TaskMinionModel>();

export interface TaskMinionsProps {
  taskStore: TaskStore;
}

export const TaskMinions = observer(function TaskMinions({ taskStore }: TaskMinionsProps) {
  const { t } = useTranslation();

  const taskDrawer = useInfoDrawer<TaskMinionModel, string, HTMLTableSectionElement>({
    getId: (minion) => minion.id,
  });

  const selectedMinion = useMemo(() => {
    if (taskDrawer.openedId == null) return null;
    return taskStore.minions?.find((m) => m.id === taskDrawer.openedId) ?? null;
  }, [taskDrawer.openedId, taskStore.minions]);

  const selectedMinionJobReturns = useMemo(() => {
    if (!selectedMinion) return [];
    const minionJobIds = Object.keys(selectedMinion.jobs ?? {})
      .sort()
      .reverse();
    return minionJobIds
      .map((jobId) =>
        taskStore.jobReturns?.find(
          (jobReturn) =>
            jobReturn.jid === jobId &&
            jobReturn.salt_master === selectedMinion.master &&
            jobReturn.minion_id === selectedMinion.minion_id
        )
      )
      .filter((jobReturn) => jobReturn !== undefined);
  }, [selectedMinion, taskStore.jobReturns]);

  const slug = taskStore.task?.target_collection?.slug ?? null;
  const collectionSlug = taskStore.task?.target_collection?.slug ?? "";

  const handleRestartFailedMinionClick = useRestartFailedMinionHandler(
    taskStore.handleRestartFailedMinion,
    t
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
                row.status === TaskMinionStatus.Failed && !!taskStore.handleRestartFailedMinion,
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
    [collectionSlug, handleRestartFailedMinionClick, taskStore.handleRestartFailedMinion, t]
  );

  return (
    <>
      <TaskMinionsTable
        columns={columns}
        getRowId={(row) => row.id}
        data={taskStore.minions}
        total={taskStore.totalMinions}
        isLoading={taskStore.isMinionsLoading}
        pagination={taskStore.minionsPagination}
        sorting={taskStore.minionsSorting}
        onLazyLoad={taskStore.handleMinionsLazyLoad}
        activeRowId={taskDrawer.activeRowId}
        bodyRef={taskDrawer.mainContentRef}
        onRowClick={(minion) => {
          taskDrawer.toggle(toJS(minion));
        }}
        useVirtualScroll={false}
      />

      <MinionTaskResultsDrawer
        isOpened={taskDrawer.isOpened}
        openedId={taskDrawer.openedId}
        selectedMinion={selectedMinion}
        selectedMinionJobReturns={selectedMinionJobReturns}
        slug={slug}
        onClose={taskDrawer.close}
        onRestartFailedMinion={taskStore.handleRestartFailedMinion}
      />
    </>
  );
});
