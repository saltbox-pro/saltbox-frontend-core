import { TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  FastTableToolbarSlot,
  FastTableToolbarSlotProvider,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CollectionLink } from "saltbox-core/shared/components/collection-link";
import { EntitySourceType } from "saltbox-core/shared/components/entity-source";
import { TaskMinionsCountProgress } from "saltbox-core/shared/components/task/task-minions-count-progress";
import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import { getTasksFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";
import { apiCoreStore, appStore, TasksFilterStore, TasksStore } from "saltbox-core/store";

import { TasksQueryBuilder } from "../minions.$slug/-components/tasks-query-builder";

const TasksTable = FastTablePaginated<TaskListResponseSchema>;
const columnHelper = createColumnHelper<TaskListResponseSchema>();

export default observer(function TasksPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [tasksStore] = useState(() => new TasksStore(TaskType.Classic));
  const [filterStore] = useState(() => new TasksFilterStore([], "tasksFilter"));
  const [webSocketService] = useState(() => new WebSocketService<TaskListResponseSchema>());

  const filterSchema = useMemo(
    () =>
      getTasksFilterSchema(t, {
        includeTargetCollection: true,
        includeSourceType: true,
        taskType: TaskType.Classic,
      }),
    [t]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        meta: {
          showCopy: true,
          color: "accent",
          width: "10%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("task_template.title", {
        id: "task_template.title",
        header: t("minions.table-task-template-title"),
        cell: (data) =>
          getTemplateTitleText(data.getValue(), i18n.language) ||
          data.row.original?.task_template?.name,
        meta: {
          width: "10%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("task_template.name", {
        id: "task_template.name",
        header: t("minions.table-task-template-name"),
        meta: {
          width: "10%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("target_collection.title", {
        id: "target_collection.title",
        header: t("minions.table-collection"),
        cell: (data) => (
          <CollectionLink slug={data.row.original?.target_collection?.slug}>
            {data.getValue()}
          </CollectionLink>
        ),
        meta: {
          width: "9%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("source.type", {
        id: "source.type",
        header: t("entity-source.column"),
        cell: (data) => (
          <EntitySourceType type={data.getValue()} sourceId={data.row.original?.source?.id} />
        ),
        meta: {
          width: "9%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("minions.table-user"),
        meta: {
          width: "9%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("status.type", {
        id: "status.type",
        header: t("minions.table-status"),
        cell: (data) => <TaskStatusIndicator status={data.row.original?.status.type} />,
        meta: {
          width: "9%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("minions_count.total", {
        id: "minions_count.total",
        header: t("minions.table-total-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: {
          width: "8%",
          minWidth: 120,
        },
      }),
      columnHelper.accessor("minions_count.failed", {
        id: "minions_count.failed",
        header: t("minions.table-failed-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: {
          width: "8%",
          minWidth: 120,
        },
      }),
      columnHelper.display({
        header: t("minions.table-progress"),
        enableSorting: false,
        cell: (data) => (
          <TaskMinionsCountProgress
            counts={data.row.original?.minions_count}
            taskType={TaskType.Classic}
          />
        ),
        meta: {
          width: "8%",
          minWidth: 130,
        },
      }),
      columnHelper.accessor("created", {
        header: t("minions.tasks-table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: {
          width: "10%",
          minWidth: 170,
        },
      }),
    ],
    [t, i18n.language]
  );

  useEffect(() => {
    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);

  useEffect(() => {
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.loadTasks();
  }, [filterStore, tasksStore]);

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<TaskListResponseSchema>>) => {
          if (messages?.length > 0) {
            const filteredMessages = messages
              .filter((message) => message.message_tag === "task")
              .filter((message) => message.payload.task_type === TaskType.Classic)
              .map((message) => message.payload);

            tasksStore.updateTasks(filteredMessages);
          }
        },
      }
    );
    return () => {
      webSocketService.disconnect();
      tasksStore.init();
    };
  }, []);

  const handleSearchButtonClick = () => {
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(undefined);
  };

  const handleResetButtonClick = () => {
    filterStore.handleResetFilters();
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(undefined);
  };

  return (
    <FastTableToolbarSlotProvider>
      <PageHeader title={t("aggregated-tasks.title")} />
      <TasksQueryBuilder
        filterStore={filterStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
      />
      <div className="page-actions-buttons">
        <FastTableToolbarSlot />
      </div>
      <TasksTable
        tableId="core-tasks"
        columns={columns}
        getRowId={(row) => row.id}
        data={tasksStore.tasks}
        total={tasksStore.total}
        isLoading={tasksStore.isTasksLoading}
        pagination={tasksStore.pagination}
        sorting={tasksStore.sorting}
        onLazyLoad={(pagination, sorting) => tasksStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(task) =>
          navigate(`/core/minions/${task.target_collection.slug}/tasks/${task.id}`)
        }
        useVirtualScroll={false}
      />
    </FastTableToolbarSlotProvider>
  );
});
