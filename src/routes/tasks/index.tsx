import { TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  TASK_TABLE_DEFAULT_HIDDEN_COLUMN_IDS,
  useTaskTableColumns,
} from "saltbox-core/shared/components/task/table";
import { getTasksFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { apiCoreStore, appStore, TasksFilterStore, TasksStore } from "saltbox-core/store";

import { TasksQueryBuilder } from "../minions.$slug/-components/tasks-query-builder";

const TasksTable = FastTable.Paginated<TaskListResponseSchema>;

export default observer(function TasksPage() {
  const { t } = useTranslation();
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

  const columns = useTaskTableColumns({
    taskType: TaskType.Classic,
    includeTargetCollection: true,
  });

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
    <>
      <PageHeader title={t("aggregated-tasks.title")} />
      <TasksQueryBuilder
        filterStore={filterStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
      />
      <FastTable.Provider>
        <div className="page-actions-buttons">
          <FastTable.Toolbar />
        </div>
        <TasksTable
          tableId="core-tasks"
          columns={columns}
          defaultHiddenColumnIds={TASK_TABLE_DEFAULT_HIDDEN_COLUMN_IDS}
          getRowId={(row) => row.id}
          data={tasksStore.tasks}
          total={tasksStore.total}
          isLoading={tasksStore.isTasksLoading}
          onRefresh={() => tasksStore.loadTasks()}
          loader={tasksStore.tasksLoad}
          pagination={tasksStore.pagination}
          sorting={tasksStore.sorting}
          onLazyLoad={(pagination, sorting) => tasksStore.handleLazyLoad(pagination, sorting)}
          onRowClick={(task) =>
            navigate(`/core/minions/${task.target_collection.slug}/tasks/${task.id}`)
          }
          useVirtualScroll
        />
      </FastTable.Provider>
    </>
  );
});
