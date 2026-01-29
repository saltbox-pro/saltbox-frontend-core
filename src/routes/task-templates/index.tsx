import { ExportOutlined } from "@ant-design/icons";
import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, PageHeader } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { taskTemplatesStore } from "saltbox-core/store";

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
      cell: (data) => data.getValue(),
      meta: {
        actions: [
          {
            icon: <ExportOutlined />,
            onClick: (value, row) => {
              window.open(row.repo_info.repo_url, "_blank");
            },
            title: t("task-templates.table-go-to-repository"),
          },
        ],
      },
    }),
    columnHelper.accessor("commit_hash", {
      header: t("task-templates.table-last-commit"),
      cell: (data) => {
        const commitHash = data.getValue()?.slice(0, 7) + "...";
        return commitHash;
      },
      meta: {
        showCopy: true,
        actions: [
          {
            icon: <ExportOutlined />,
            onClick: (value, row) => {
              const repoCommitUrl =
                row.repo_info.repo_url.replace(".git", "") + `/-/commit/${row.commit_hash}`;
              window.open(repoCommitUrl, "_blank");
            },
            title: t("task-templates.table-go-to-repository"),
          },
        ],
      },
    }),
  ];
  const [selection, setSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    taskTemplatesStore.reload();
  }, []);

  return (
    <>
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
        onLazyLoad={(pagination) => taskTemplatesStore.handleLazyLoad(pagination)}
      />
    </>
  );
});

export default TaskTemplatesPage;
