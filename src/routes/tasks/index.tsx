import { TaskListResponseSchema, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  PageHeader,
  Popover,
  WebSocketMessage,
  WebSocketService,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex, Progress } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import { getTasksFilterSchema } from "saltbox-core/shared/constants/filter-schemas";
import { apiCoreStore, appStore, TasksFilterStore, TasksStore } from "saltbox-core/store";

import { TasksQueryBuilder } from "../minions.$slug/-components/tasks-query-builder";

const TasksTable = FastTablePaginated<TaskListResponseSchema>;
const columnHelper = createColumnHelper<TaskListResponseSchema>();

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

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        meta: {
          showCopy: true,
          color: "accent",
          width: "10%",
          minWidth: 200,
          maxWidth: 200,
          ellipsis: true,
        },
      }),
      columnHelper.accessor("task_template.title", {
        id: "task_template.title",
        header: t("minions.table-task-template-title"),
        meta: {
          width: "10%",
          minWidth: 200,
        },
      }),
      columnHelper.accessor("task_template.name", {
        id: "task_template.name",
        header: t("minions.table-task-template-name"),
        meta: {
          width: "10%",
          minWidth: 210,
        },
      }),
      columnHelper.accessor("target_collection.title", {
        id: "target_collection.title",
        header: t("minions.table-collection"),
        cell: (data) => {
          const slug = data.row.original?.target_collection?.slug;
          return (
            <span
              role="link"
              tabIndex={0}
              style={{ color: "#1677ff", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                if (slug) navigate(`/core/minions/${slug}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && slug) {
                  e.stopPropagation();
                  navigate(`/core/minions/${slug}`);
                }
              }}
            >
              {data.getValue()}
            </span>
          );
        },
        meta: {
          width: "7%",
          minWidth: 120,
        },
      }),
      columnHelper.accessor("source.type", {
        id: "source.type",
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
        meta: {
          width: "7%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("user.name", {
        id: "user.name",
        header: t("minions.table-user"),
        meta: {
          width: "7%",
          minWidth: 120,
        },
      }),
      columnHelper.accessor("status.type", {
        id: "status.type",
        header: t("minions.table-status"),
        cell: (data) => <TaskStatusIndicator status={data.row.original?.status.type} />,
        meta: {
          width: "7%",
          minWidth: 120,
        },
      }),
      columnHelper.accessor("minions_count.total", {
        id: "minions_count.total",
        header: t("minions.table-total-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: { width: "7%", minWidth: 120 },
      }),
      columnHelper.accessor("minions_count.failed", {
        id: "minions_count.failed",
        header: t("minions.table-failed-clients"),
        cell: (data) => data.getValue() ?? 0,
        meta: { width: "7%", minWidth: 120 },
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
                size={8.5}
                percent={((statusSuccess + statusFailed) / totalMinions) * 100}
                success={{ percent: (statusSuccess / totalMinions) * 100 }}
                strokeColor={progressStrokeColors}
                showInfo={false}
              />
            </Popover>
          );
        },
        meta: { width: "5%", minWidth: 130, maxWidth: 130 },
      }),
      columnHelper.accessor("created", {
        header: t("minions.tasks-table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "10%" },
      }),
    ],
    [t, navigate]
  );

  useEffect(() => {
    filterStore.filterSchema = filterSchema;
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.loadTasks();
  }, [filterSchema, filterStore, tasksStore]);

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

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

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
      <TasksTable
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
    </>
  );
});
