import { TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import { FastTable, WebSocketMessage, WebSocketService } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  TASK_TABLE_DEFAULT_HIDDEN_COLUMN_IDS,
  useTaskTableColumns,
} from "saltbox-core/shared/components/task/table";
import { getTasksFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { apiCoreStore, appStore, TasksStore, TasksFilterStore } from "saltbox-core/store";

import styles from "./minions-task-view.module.css";
import { TasksQueryBuilder } from "./tasks-query-builder";

const TasksTable = FastTable.Paginated<TaskListResponseSchema>;

type MinionsTaskViewProps = {
  slug?: string;
  taskType?: TaskType;
  filterStore: TasksFilterStore;
};

export const MinionsTaskView = observer((props: MinionsTaskViewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tasksStore] = useState(new TasksStore(props.taskType));

  const filterSchema = useMemo(
    () =>
      getTasksFilterSchema(t, {
        includeTargetCollection: false,
        includeSourceType: true,
        taskType: props.taskType,
      }),
    [props.taskType, t]
  );

  const [webSocketService] = useState(() => new WebSocketService<TaskListResponseSchema>());

  const columns = useTaskTableColumns({
    taskType: props.taskType,
  });

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<TaskListResponseSchema>>) => {
          if (messages?.length > 0) {
            const filteredMessages = messages
              .filter((message) => message.message_tag === "task")
              .filter((message) => !props.taskType || message.payload.task_type === props.taskType)
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

  useEffect(() => {
    props.filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, props.filterStore]);

  useEffect(() => {
    if (!props.slug) return;

    tasksStore.init();
    tasksStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    tasksStore.setCollectionSlug(props.slug);
  }, [props.slug]);

  const handleSearchButtonClick = () => {
    tasksStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    props.filterStore.handleSearch();
    tasksStore.handleSearch(props.slug);
  };

  const handleResetButtonClick = () => {
    props.filterStore.handleResetFilters();
    tasksStore.mongoDBQuery = props.filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  };

  return (
    <Flex className={styles.tabWrapper} vertical>
      <TasksQueryBuilder
        filterStore={props.filterStore}
        onSearchButtonClick={handleSearchButtonClick}
        onResetButtonClick={handleResetButtonClick}
      />
      <FastTable.Provider>
        <div className="page-actions-buttons">
          <FastTable.Toolbar />
        </div>
        <TasksTable
          tableId={
            props.taskType === TaskType.Policy ? "core-minion-policies" : "core-minion-tasks"
          }
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
          onRowClick={(task) => navigate(`/core/minions/${props.slug}/tasks/${task.id}`)}
          useVirtualScroll
        />
      </FastTable.Provider>
    </Flex>
  );
});
