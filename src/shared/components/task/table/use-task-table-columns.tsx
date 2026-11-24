import { type TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import { formatTimeByUserTZ, getLocalizedText } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CollectionLink } from "saltbox-core/shared/components/collection-link";
import { EntitySourceType } from "saltbox-core/shared/components/entity-source";
import { TaskMinionsCountProgress } from "saltbox-core/shared/components/task/task-minions-count-progress";
import { TaskStatusBadge } from "saltbox-core/shared/components/task-status-badge";

const columnHelper = createColumnHelper<TaskListResponseSchema>();

export const TASK_TABLE_DEFAULT_HIDDEN_COLUMN_IDS = ["id", "task_template.name"];

export function useTaskTableColumns({
  taskType,
  includeTargetCollection = false,
}: {
  taskType?: TaskType;
  includeTargetCollection?: boolean;
}) {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const templateTitleColumn = columnHelper.accessor("task_template.title", {
      id: "task_template.title",
      header: t("minions.table-task-template-title"),
      cell: (data) => getLocalizedText(data.getValue(), i18n.language) || "—",
      meta: { width: "15%", minWidth: 180 },
    });

    return [
      ...(includeTargetCollection
        ? [
            columnHelper.accessor("target_collection.title", {
              id: "target_collection.title",
              header: t("minions.table-collection"),
              cell: (data) => (
                <CollectionLink slug={data.row.original?.target_collection?.slug}>
                  {data.getValue()}
                </CollectionLink>
              ),
              meta: { width: "15%", minWidth: 180 },
            }),
          ]
        : [templateTitleColumn]),
      columnHelper.accessor("status.type", {
        id: "status.type",
        header: t("minions.table-status"),
        cell: (data) => (
          <TaskStatusBadge
            status={data.getValue()}
            reason={data.row.original?.status.data?.reason}
          />
        ),
        meta: { width: "12%", minWidth: 150 },
      }),
      columnHelper.accessor("minions_count.total", {
        id: "minions_count.total",
        header: t("minions.table-total-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: { width: "10%", minWidth: 150 },
      }),
      columnHelper.accessor("minions_count.failed", {
        id: "minions_count.failed",
        header: t("minions.table-failed-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: { width: "10%", minWidth: 180 },
      }),
      columnHelper.display({
        header: t("minions.table-progress"),
        enableSorting: false,
        cell: (data) => (
          <TaskMinionsCountProgress counts={data.row.original?.minions_count} taskType={taskType} />
        ),
        meta: { width: "10%", minWidth: 130 },
      }),
      ...(taskType === TaskType.Policy
        ? []
        : [
            columnHelper.accessor("source.type", {
              id: "source.type",
              header: t("entity-source.column"),
              cell: (data) => (
                <EntitySourceType type={data.getValue()} sourceId={data.row.original?.source?.id} />
              ),
              meta: { width: "10%", minWidth: 150 },
            }),
          ]),
      ...(includeTargetCollection ? [templateTitleColumn] : []),
      columnHelper.accessor("task_template.name", {
        id: "task_template.name",
        header: t("minions.table-task-template-name"),
        meta: { width: "12%", minWidth: 210 },
      }),
      columnHelper.accessor("id", {
        header: "ID",
        meta: { showCopy: true, color: "accent", width: "12%", minWidth: 170 },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("minions.table-user"),
        meta: { width: "10%", minWidth: 150 },
      }),
      columnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "13%", minWidth: 170 },
      }),
    ];
  }, [i18n.language, includeTargetCollection, t, taskType]);
}
