import { TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import {
  FastTableListed,
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag } from "antd";
import { toJS } from "mobx";
import { useTranslation } from "react-i18next";

import { MinionIdCell } from "saltbox-core/shared/components/minion-id-cell";

const TaskMinionsTable = FastTableListed<TaskMinionModel>;

const columnHelper = createColumnHelper<TaskMinionModel>();

export const TaskMinions = ({
  minions,
  collectionSlug,
  isLoading,
  onRowClick,
  onMinionClick,
}: {
  minions: Array<TaskMinionModel>;
  collectionSlug: string;
  isLoading: boolean;
  onRowClick?: (minion: TaskMinionModel) => void;
  onMinionClick?: (minion: TaskMinionModel) => void;
}) => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.display({
      header: t("task.minions.table-minion-id"),
      cell: (data) => {
        const mid = data.row.original?.minion_inner_id ?? "";
        const minionId = data.row.original?.minion_id ?? "";
        return (
          <MinionIdCell
            minionId={minionId}
            innerId={mid}
            collectionSlug={collectionSlug}
            onMenuClick={() => onMinionClick?.(toJS(data.row.original))}
          />
        );
      },
      meta: {
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
      cell: (data) => {
        if (!data.getValue()) {
          return <>{t("task.minions.table-not-started")}</>;
        }
        const rawStarted: string = data.getValue();
        const started: string = formatTimeByUserTZ(rawStarted);
        const startedPastTime: string = pastTimeByUserTZ(rawStarted);
        return <Popover content={started}>{startedPastTime}</Popover>;
      },
    }),
    columnHelper.accessor("finished_dt", {
      header: t("task.minions.table-finished"),
      cell: (data) => {
        if (!data.getValue()) {
          return <>{t("task.minions.table-not-started")}</>;
        }
        const rawFinished: string = data.getValue();
        const finished: string = formatTimeByUserTZ(rawFinished);
        const finishedPastTime: string = pastTimeByUserTZ(rawFinished);
        return <Popover content={finished}>{finishedPastTime}</Popover>;
      },
    }),
  ];

  return (
    <TaskMinionsTable
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(minion) => onRowClick?.(minion)}
      data={minions}
      total={minions.length}
      isEmpty={!isLoading && !minions.length}
      isLoading={isLoading && !minions.length}
    />
  );
};
