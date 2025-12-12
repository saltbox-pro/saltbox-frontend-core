import { TaskJob, TaskModel } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FastTableListed,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const { Text } = Typography;

const TaskJobsTable = FastTableListed<TaskJob>;

const columnHelper = createColumnHelper<TaskJob>();

export const TaskJobs = ({ task, isLoading }: { task: TaskModel | null; isLoading: boolean }) => {
  const { t } = useTranslation();

  const columns = [
    columnHelper.accessor("jid", {
      header: t("task.jobs.table-jid"),
      cell: (data) => (
        <>
          <Link to={`/job/${data.getValue()}`}>
            <Button type="link" size={"small"}>
              {data.getValue()}
            </Button>
          </Link>
          <CopyToClipboardButton text={data.getValue()} />
        </>
      ),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    columnHelper.accessor("status", {
      header: t("task.jobs.table-status"),
      cell: (data) => {
        switch (data.getValue()) {
          case "running":
            return <Tag color="blue">{t("task.jobs.table-running")}</Tag>;
          case "failed":
            return <Tag color="red">{t("task.jobs.table-failed")}</Tag>;
          case "succeeded":
            return <Tag color="green">{t("task.jobs.table-succeeded")}</Tag>;
          case "pending":
            return <Tag color="yellow">{t("task.jobs.table-pending")}</Tag>;
          default:
            return <Tag>{`${t("task.jobs.table-unknown-code")}: ${data.getValue()}`}</Tag>;
        }
      },
    }),
    columnHelper.accessor("target.master", {
      header: t("task.jobs.table-target-master"),
    }),
    columnHelper.accessor("target.tgt", {
      header: t("task.jobs.table-targets"),
      cell: (data) => {
        if ((data.getValue() as string)?.length <= 2) {
          return data.getValue();
        }
        return (
          <Text
            copyable={{
              text: data.getValue() as string,
              tooltips: t("task.jobs.table-copy"),
            }}
            title={data.getValue() as string}
          >
            {t("task.job-tgt-count", {
              count: data.row.original.minions_by_targeting.length ?? 0,
            })}
          </Text>
        );
      },
    }),
    columnHelper.accessor("target.tgt_type", {
      header: t("task.jobs.table-target-type"),
    }),
    columnHelper.accessor("created_dt", {
      header: t("task.jobs.table-created"),
      cell: (data) => {
        const created = formatTimeByUserTZ(data.getValue());
        return <div>{created}</div>;
      },
    }),
  ];

  const taskJobs = Object.values(task?.jobs ?? {});

  return (
    <TaskJobsTable
      columns={columns}
      getRowId={(row) => row.jid}
      data={taskJobs}
      total={taskJobs.length}
      isEmpty={!isLoading && !taskJobs.length}
      isLoading={isLoading && !taskJobs.length}
    />
  );
};
