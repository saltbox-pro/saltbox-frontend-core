import { ExportOutlined } from "@ant-design/icons";
import { TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { FastTableListed, RelativeTime } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";

const TaskMinionsTable = FastTableListed<TaskMinionModel>;

const columnHelper = createColumnHelper<TaskMinionModel>();

export const TaskMinions = ({
  minions,
  collectionSlug,
  isLoading,
  onMinionClick,
}: {
  minions: Array<TaskMinionModel>;
  collectionSlug: string;
  isLoading: boolean;
  onMinionClick?: (minion: TaskMinionModel) => void;
}) => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.display({
      header: t("task.minions.table-minion-id"),
      cell: (data) => {
        const minionId = data.row.original?.minion_id ?? "";
        return <span style={{ color: "#1677ff" }}>{minionId}</span>;
      },
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
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    columnHelper.display({
      header: t("task.minions.table-master"),
      cell: (data) => {
        return data.row.original?.master;
      },
    }),
    columnHelper.accessor("status", {
      header: t("task.minions.table-status"),
      cell: (data) => <MinionTaskStatus status={data.getValue()} />,
    }),
    columnHelper.accessor("count_runs", {
      header: t("task.minions.table-count-runs"),
    }),
    columnHelper.accessor("start_last_dt", {
      header: t("task.minions.table-started"),
      cell: (data) => (
        <RelativeTime
          date={data.getValue()}
          fallback={<>{t("task.minions.table-not-started")}</>}
        />
      ),
    }),
    columnHelper.accessor("finished_dt", {
      header: t("task.minions.table-finished"),
      cell: (data) => (
        <RelativeTime
          date={data.getValue()}
          fallback={<>{t("task.minions.table-not-started")}</>}
        />
      ),
    }),
  ];

  return (
    <TaskMinionsTable
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(minion) => onMinionClick?.(toJS(minion))}
      data={minions}
      total={minions.length}
      isEmpty={!isLoading && !minions.length}
      isLoading={isLoading && !minions.length}
    />
  );
};
