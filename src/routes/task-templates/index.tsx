import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Typography } from "antd";
import { ExportOutlined, HomeOutlined } from "@ant-design/icons";
import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FastTablePaginated,
  PageHeader,
} from "@saltbox/saltbox-frontend-common";
import { taskTemplatesStore } from "saltbox-core/store";

const { Text } = Typography;

const TaskTemplatesTable = FastTablePaginated<TaskTemplateShortSchema>;

const columnHelper = createColumnHelper<TaskTemplateShortSchema>();

const TaskTemplatesPage = observer(() => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.accessor("title", {
      header: t("task-templates.table-title"),
    }),
    columnHelper.accessor("fun", {
      header: t("task-templates.table-function"),
    }),
    columnHelper.accessor("name", {
      header: t("task-templates.table-name"),
    }),
    columnHelper.accessor("repo_info.name", {
      header: t("task-templates.table-repository"),
      cell: (data) => {
        return (
          <>
            {data.getValue()}
            <Button
              type="link"
              size="small"
              href={data.row.original.repo_info.repo_url}
              target="_blank"
              icon={<ExportOutlined />}
              title={t("task-templates.table-go-to-repository")}
            />
          </>
        );
      },
    }),
    columnHelper.accessor("commit_hash", {
      header: t("task-templates.table-last-commit"),
      cell: (data) => {
        const commitHash = data.getValue()?.slice(0, 7) + "...";
        const repoCommitUrl =
          data.row.original.repo_info.repo_url.replace(".git", "") +
          `/-/commit/${data.row.original.commit_hash}`;
        const fullCommitHash = data.getValue();

        return (
          <>
            {commitHash}
            <CopyToClipboardButton text={fullCommitHash} />
            <Button
              type="link"
              size="small"
              href={repoCommitUrl}
              target="_blank"
              icon={<ExportOutlined />}
              title={t("task-templates.table-go-to-repository")}
            />
          </>
        );
      },
    }),
  ];
  const [selection, setSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    taskTemplatesStore.reload();
  }, []);

  return (
    <>
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("task-templates.title"),
          },
        ]}
      />

      <PageHeader title={t("task-templates.title")} />

      <TaskTemplatesTable
        columns={columns}
        getRowId={(row) => row.id}
        data={taskTemplatesStore.taskTemplates}
        total={taskTemplatesStore.total}
        isLoading={taskTemplatesStore.isTaskTemplatesLoading}
        pagination={taskTemplatesStore.pagination}
        onRowSelectionChange={setSelection}
        rowSelection={selection}
        onLazyLoad={(pagination) =>
          taskTemplatesStore.handleLazyLoad(pagination)
        }
      />
    </>
  );
});

export default TaskTemplatesPage;
