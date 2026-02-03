import { TaskListResponseSchema, TaskStatus } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  Popover,
  WebSocketMessage,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex, Progress } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import { RelativeTime } from "saltbox-core/shared/ui/time";
import { apiCoreStore, appStore, tasksStore } from "saltbox-core/store";

import styles from "./minions-task-view.module.css";
import { TasksQueryBuilder } from "./tasks-query-builder";

const TasksTable = FastTablePaginated<TaskListResponseSchema>;
const columnHelper = createColumnHelper<TaskListResponseSchema>();

const defaultStringOperators = [
  {
    name: "contains",
    value: "contains",
    label: "contains",
  },
  {
    name: "=",
    value: "=",
    label: "=",
  },
  {
    name: "!=",
    value: "!=",
    label: "!=",
  },
];

const defaultDateTimeOperators = [
  {
    name: "<=",
    value: "<=",
    label: "<=",
  },
  {
    name: ">=",
    value: ">=",
    label: ">=",
  },
];

const defaultListOperators = [
  {
    name: "in",
    value: "in",
    label: "In",
  },
  {
    name: "notIn",
    value: "notIn",
    label: "Not In",
  },
];

export const MinionsTaskView = observer((props: { slug?: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const filterSchema = useMemo(
    () => [
      {
        name: "source.type",
        label: t("minions.table-source-type"),
        operators: defaultListOperators,
        type: "multiselect",
        selectOptions: [
          { label: t("minions.table-soruce-type-rest"), value: "rest" },
          {
            label: t("minions.table-soruce-type-scheduler"),
            value: "scheduler",
          },
        ],
      },
      {
        name: "task_template.title",
        label: t("minions.table-task-template-title"),
        operators: defaultStringOperators,
      },
      {
        name: "task_template.name",
        label: t("minions.table-task-template-name"),
        operators: defaultStringOperators,
      },
      {
        name: "user.name",
        label: t("minions.table-user"),
        operators: defaultStringOperators,
      },
      {
        name: "status.type",
        label: t("minions.table-status"),
        operators: defaultListOperators,
        type: "multiselect",
        selectOptions: [
          { label: t("task.created"), value: TaskStatus.Created },
          { label: t("task.running"), value: TaskStatus.Running },
          { label: t("task.stopping"), value: TaskStatus.Stopping },
          { label: t("task.stopped"), value: TaskStatus.Stopped },
          { label: t("task.finished"), value: TaskStatus.Finished },
        ],
      },
      {
        name: "created",
        label: t("minions.table-created"),
        operators: defaultDateTimeOperators,
        inputType: "datetime-local",
        valueEditorType: "datetime-local",
      },
    ],
    [t]
  );

  const [webSocketService] = useState(new WebSocketService<TaskListResponseSchema>());

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (data) => {
          return <span style={{ color: "#1677ff" }}>{data.getValue()}</span>;
        },
        meta: {
          showCopy: true,
          tdClassName: "fast-table-column-nowrap",
        },
      }),
      columnHelper.accessor("task_template.title", {
        header: t("minions.table-task-template-title"),
      }),
      columnHelper.accessor("task_template.name", {
        header: t("minions.table-task-template-name"),
      }),
      columnHelper.accessor("source.type", {
        header: t("minions.table-source-type"),
        cell: (data) => {
          switch (data.getValue()) {
            case "rest":
              return t("minions.table-soruce-type-rest");
            case "scheduler":
              return t("minions.table-soruce-type-scheduler");
            default:
              return data.getValue();
          }
        },
      }),
      columnHelper.accessor("user.name", {
        header: t("minions.table-user"),
      }),
      columnHelper.accessor("status.type", {
        header: t("minions.table-status"),
        cell: (data) => {
          return <TaskStatusIndicator status={data.row.original?.status.type} />;
        },
      }),
      columnHelper.display({
        header: t("minions.table-progress"),
        enableSorting: false,
        cell: (data) => {
          const totalMinions = data.row.original?.minions_count.total;
          const statusFailed = data.row.original?.minions_count.failed;
          const statusSuccess = data.row.original?.minions_count.success ?? 0;
          const statusInWork = data.row.original?.minions_count.in_work ?? 0;
          const statusPending = data.row.original?.minions_count.pending ?? 0;
          const progressStrokeColors = Array.from({ length: 10 }, (_, i) => {
            if (i < Math.ceil((statusSuccess / totalMinions) * 10)) {
              return "#52c41a";
            } else if (i < Math.ceil(((statusSuccess + statusFailed) / totalMinions) * 10)) {
              return "#ff4d4f";
            }
            return "#bfbfbf";
          });
          const popoverContent = (
            <Flex vertical>
              <Flex>
                <strong>{t("minions.tasks-table-status-header")}</strong>
              </Flex>
              <Flex justify="space-between">
                <span>{t("minions.tasks-table-status-in-work")}:</span>
                <span style={{ color: "#1677ff" }}>{statusInWork}</span>
              </Flex>
              <Flex justify="space-between">
                <span>{t("minions.tasks-table-status-pending")}:</span>
                <span style={{ color: "#919191" }}>{statusPending}</span>
              </Flex>
              <Flex justify="space-between">
                <span>{t("minions.tasks-table-status-failed")}:</span>
                <span style={{ color: "#ff4d4f" }}>{statusFailed}</span>
              </Flex>
              <Flex justify="space-between">
                <span>{t("minions.tasks-table-status-success")}:</span>
                <span style={{ color: "#52c41a" }}>{statusSuccess}</span>
              </Flex>
              <Flex justify="space-between">
                <span>{t("minions.tasks-table-total-minions")}:</span>
                <span style={{ fontWeight: "bold" }}>{totalMinions}</span>
              </Flex>
            </Flex>
          );

          return (
            <Popover content={popoverContent}>
              <Progress
                steps={10}
                percent={((statusSuccess + statusFailed) / totalMinions) * 100}
                success={{ percent: (statusSuccess / totalMinions) * 100 }}
                strokeColor={progressStrokeColors}
                showInfo={false}
              />
            </Popover>
          );
        },
      }),
      columnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => <RelativeTime date={data.getValue()} />,
      }),
    ],
    [t]
  );

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<TaskListResponseSchema>>) => {
          if (messages?.length > 0) {
            tasksStore.updateTasks(
              messages
                .filter((message) => message.message_tag === "task")
                .map((message) => message.payload)
            );
          }
        },
      }
    );
    return () => {
      webSocketService.disconnect();
      tasksStore.init(filterSchema);
    };
  }, []);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

  useEffect(() => {
    if (props.slug) {
      tasksStore.init(filterSchema);
      tasksStore.mongoDBQuery = tasksStore.filterStore.searchMongoDBQuery;
      tasksStore.setCollectionSlug(props.slug);
    }
  }, [props.slug, filterSchema]);

  const handleSearchButtonClick = () => {
    tasksStore.mongoDBQuery = tasksStore.filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  };

  const handleResetButtonClick = () => {
    tasksStore.filterStore.handleResetFilters();
    tasksStore.mongoDBQuery = tasksStore.filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  };

  return (
    <Flex className={styles.tabWrapper} vertical>
      {tasksStore.filterStore && (
        <TasksQueryBuilder
          filterStore={tasksStore.filterStore}
          onSearchButtonClick={handleSearchButtonClick}
          onResetButtonClick={handleResetButtonClick}
        />
      )}
      <TasksTable
        columns={columns}
        getRowId={(row) => row.id}
        data={tasksStore.tasks}
        total={tasksStore.total}
        isLoading={tasksStore.isTasksLoading}
        pagination={tasksStore.pagination}
        sorting={tasksStore.sorting}
        onLazyLoad={(pagination, sorting) => tasksStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(task) => navigate(`/task/${task.id}`)}
        useVirtualScroll={false}
      />
    </Flex>
  );
});
