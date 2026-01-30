import { ExportOutlined } from "@ant-design/icons";
import { TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag } from "antd";
import { toJS } from "mobx";
import { useTranslation } from "react-i18next";
import { RelativeTime } from "saltbox-core/shared/ui/time";

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
            onClick: (value, row) => {
              const mid = row.minion_inner_id ?? "";
              if (collectionSlug && mid) {
                window.open(`/core/minion/${collectionSlug}/${mid}`, "_blank");
              }
            },
            title: t("minions.open-in-new-tab"),
            visible: (value, row) => !!(collectionSlug && row.minion_inner_id),
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
      cell: (data) => {
        switch (data.getValue()) {
          case TaskMinionStatus.InWork:
            return <Tag color="blue">{t("task.minions.table-in-work")}</Tag>;
          case TaskMinionStatus.Failed:
            return <Tag color="red">{t("task.minions.table-failed")}</Tag>;
          case TaskMinionStatus.Success:
            return <Tag color="green">{t("task.minions.table-success")}</Tag>;
          case TaskMinionStatus.Pending:
            return <Tag color="yellow">{t("task.minions.table-pending")}</Tag>;
          default:
            return <Tag>{`${t("task.minions.table-unknown-code")}: ${data.getValue()}`}</Tag>;
        }
      },
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
