import { ExportOutlined, IssuesCloseOutlined } from "@ant-design/icons";
import { type TaskMinionListResponse, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  formatTimeByUserTZ,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { buildMinionDetailsPagePath } from "saltbox-core/features/minion-details";
import { MinionTaskResultsDrawer } from "saltbox-core/features/task/job-return";
import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";
import type { TaskStore } from "saltbox-core/store";
import { useRestartFailedMinionHandler } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

const TaskMinionsTable = FastTablePaginated<TaskMinionListResponse>;
const columnHelper = createColumnHelper<TaskMinionListResponse>();

export interface TaskMinionsProps {
  taskStore: TaskStore;
}

export const TaskMinions = observer(function TaskMinions({ taskStore }: TaskMinionsProps) {
  const { t } = useTranslation();

  const taskDrawer = useInfoDrawer<TaskMinionListResponse, string, HTMLTableSectionElement>({
    getId: (minion) => minion.id,
  });

  const selectedMinion = useMemo(() => {
    if (taskDrawer.openedId == null) return null;
    return taskStore.minions?.find((m) => m.id === taskDrawer.openedId) ?? null;
  }, [taskDrawer.openedId, taskStore.minions]);

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
          copyValue: (row: TaskMinionListResponse) => row.minion_id ?? "",
          actions: [
            {
              icon: <ExportOutlined />,
              getHref: (_, row) =>
                buildMinionDetailsPagePath(collectionSlug, row.minion_inner_id ?? ""),
              title: t("minions.open-minion-details-page"),
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
        cell: (data) =>
          data.getValue()
            ? formatTimeByUserTZ(data.getValue())
            : t("task.minions.table-not-started"),
        meta: { width: "15%", minWidth: 170 },
      }),
      columnHelper.accessor("finished_dt", {
        header: t("task.minions.table-finished"),
        cell: (data) =>
          data.getValue()
            ? formatTimeByUserTZ(data.getValue())
            : t("task.minions.table-not-started"),
        meta: { width: "15%", minWidth: 170 },
      }),
    ],
    [collectionSlug, handleRestartFailedMinionClick, taskStore.handleRestartFailedMinion, t]
  );

  return (
    <>
      <TaskMinionsTable
        tableId="core-task-minions"
        enableColumnResize={false}
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
        actionLinkComponent={Link}
      />

      <MinionTaskResultsDrawer
        taskStore={taskStore}
        taskId={taskStore.task?.id}
        isOpened={taskDrawer.isOpened}
        openedId={taskDrawer.openedId}
        selectedMinion={selectedMinion}
        slug={slug}
        onClose={taskDrawer.close}
        onRestartFailedMinion={taskStore.handleRestartFailedMinion}
      />
    </>
  );
});
