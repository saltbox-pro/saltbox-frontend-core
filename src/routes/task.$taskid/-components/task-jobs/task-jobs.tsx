import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tag, Typography } from "antd";
import { TaskJob, TaskModel } from "saltbox-core-api";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { FastTableListed } from "saltbox-core/shared/components/fast-table-listed/fast-table-listed";
import { formatTimeByUserTZ } from "saltbox-core/shared/utils/datetime";

const { Text } = Typography;

const TaskJobsTable = FastTableListed<TaskJob>;

const columnHelper = createColumnHelper<TaskJob>();

export const TaskJobs = ({ task }: { task: TaskModel | null }) => {
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
            return (
              <Tag>{`${t("task.jobs.table-unknown-code")}: ${data.getValue()}`}</Tag>
            );
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
            ellipsis
            style={{ maxWidth: "250px" }}
            title={data.getValue() as string}
          >
            {data.getValue() as string}
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
  return (
    <TaskJobsTable
      columns={columns}
      getRowId={(row) => row.jid}
      data={Object.values(task?.jobs ?? {})}
      total={Object.keys(task?.jobs ?? {}).length}
    ></TaskJobsTable>
  );
};
