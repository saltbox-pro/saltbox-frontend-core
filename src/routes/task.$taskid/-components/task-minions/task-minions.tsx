import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tag } from "antd";
import { TaskMinion, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { FastTableListed, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";

const TaskMinionsTable = FastTableListed<TaskMinion>;

const columnHelper = createColumnHelper<TaskMinion>();

export const TaskMinions = ({
  minions,
  collectionSlug,
  isLoading,
}: {
  minions: Array<TaskMinion>;
  collectionSlug: string;
  isLoading: boolean;
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
            <Link to={`/minion/${collectionSlug}/${mid}/`}>
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
          return <></>;
        }
        const started = formatTimeByUserTZ(data.getValue());
        return <div>{started}</div>;
      },
    }),
    columnHelper.accessor("finished_dt", {
      header: t("task.minions.table-finished"),
      cell: (data) => {
        if (!data.getValue()) {
          return <></>;
        }
        const finished = formatTimeByUserTZ(data.getValue());
        return <div>{finished}</div>;
      },
    }),
  ];

  return (
    <TaskMinionsTable
      columns={columns}
      getRowId={(row) => row.minion_id}
      data={minions}
      total={minions.length}
      isEmpty={!isLoading && !minions.length}
      isLoading={isLoading && !minions.length}
    />
  );
};
