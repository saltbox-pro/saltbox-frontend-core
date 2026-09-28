import { TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  WebSocketMessage,
  WebSocketService,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { EntitySourceType } from "saltbox-core/shared/components/entity-source";
import { TaskMinionsCountProgress } from "saltbox-core/shared/components/task/task-minions-count-progress";
import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import { getTasksFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";
import { apiCoreStore, appStore, TasksStore, TasksFilterStore } from "saltbox-core/store";

import styles from "./minions-task-view.module.css";
import { TasksQueryBuilder } from "./tasks-query-builder";

const TasksTable = FastTable.Paginated<TaskListResponseSchema>;
const columnHelper = createColumnHelper<TaskListResponseSchema>();

type MinionsTaskViewProps = {
  slug?: string;
  taskType?: TaskType;
  filterStore: TasksFilterStore;
};

export const MinionsTaskView = observer((props: MinionsTaskViewProps) => {
  const { t, i18n } = useTranslation();
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
      ...(props.taskType === TaskType.Policy
        ? []
        : [
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
          ]),
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
        cell: (data) => {
          return (
            <TaskStatusIndicator
              status={data.row.original?.status.type}
              reason={data.row.original?.status.data?.reason}
            />
          );
        },
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
            taskType={props.taskType}
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
    [t, i18n.language, props.taskType]
  );

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
          useVirtualScroll={false}
        />
      </FastTable.Provider>
    </Flex>
  );
});
