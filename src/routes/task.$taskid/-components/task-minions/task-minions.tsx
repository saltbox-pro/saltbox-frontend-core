import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Popover, Tag } from "antd";
import { TaskMinion, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { FastTableListed, formatTimeByUserTZ, pastTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { toJS } from "mobx";

const TaskMinionsTable = FastTableListed<TaskMinion>;

const columnHelper = createColumnHelper<TaskMinion>();

export const TaskMinions = ({
  minions,
  collectionSlug,
  isLoading,
  onRowClick,
  onMinionClick,
}: {
  minions: Array<TaskMinion>;
  collectionSlug: string;
  isLoading: boolean;
  onRowClick?: (minion: TaskMinion) => void;
  onMinionClick?: (minion: TaskMinion) => void;
}) => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.accessor("minion_id", {
      header: t("task.minions.table-minion-id"),
      cell: (data) => {
        const mid = data.row.original?.id ?? "";
        if (mid === "") {
          return data.getValue();
        }
        return (
          <>
            <Link
              to={`/minion/${collectionSlug}/${mid}/`}
              onClick={(event) => {
                event.preventDefault();
                onMinionClick?.(toJS(data.row.original));
              }}
            >
              <Button type="link" size={"small"}>
                {data.getValue()}
              </Button>
            </Link>
            <CopyToClipboardButton text={data.getValue()} />
          </>
        );
      },
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    columnHelper.accessor("master", {
      header: t("task.minions.table-master"),
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
            return (
              <Tag>{`${t(
                "task.minions.table-unknown-code"
              )}: ${data.getValue()}`}</Tag>
            );
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
      getRowId={(row) => row.minion_id}
      onRowClick={(minion) => onRowClick?.(minion)}
      data={minions}
      total={minions.length}
      isEmpty={!isLoading && !minions.length}
      isLoading={isLoading && !minions.length}
    />
  );
};
