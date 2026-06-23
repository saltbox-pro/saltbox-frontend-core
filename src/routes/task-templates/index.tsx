import { ExportOutlined } from "@ant-design/icons";
import { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, PageHeader } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { taskTemplatesStore } from "saltbox-core/store";

const TaskTemplatesTable = FastTablePaginated<TaskTemplatePublicSchema>;

const columnHelper = createColumnHelper<TaskTemplatePublicSchema>();

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
    columnHelper.accessor("source_id", {
      id: "source_id",
      header: t("task-templates.table-repository"),
      cell: (data) => {
        const sourceId = data.getValue();
        return taskTemplatesStore.getSourceInfo(sourceId)?.name ?? sourceId;
      },
      meta: {
        actions: [
          {
            icon: <ExportOutlined />,
            onClick: (_value, row) => {
              const repoUrl = taskTemplatesStore.getSourceInfo(row.source_id)?.repoUrl;
              if (repoUrl) {
                window.open(repoUrl, "_blank");
              }
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
        sorting={taskTemplatesStore.sorting}
        onRowSelectionChange={setSelection}
        rowSelection={selection}
        onLazyLoad={(pagination, sorting) => taskTemplatesStore.handleLazyLoad(pagination, sorting)}
      />
    </>
  );
});

export default TaskTemplatesPage;
