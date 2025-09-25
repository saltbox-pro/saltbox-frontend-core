import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Button, Flex, Popover, Progress, Tag, Tooltip } from "antd";
import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";
import { FastTablePaginated, pastTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, appStore, TasksFilterStore, TasksStore } from "saltbox-core/store";
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
    name: "=",
    value: "=",
    label: "=",
  },
  {
    name: "!=",
    value: "!=",
    label: "!=",
  },
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

  const filterSchema = [
    {
      name: "source.type",
      label: t("minions.table-source-type"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: [
        { label: t("minions.table-soruce-type-rest"), value: "rest" },
        { label: t('minions.table-soruce-type-scheduler'), value: "scheduler" }
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
      name: "status",
      label: t("minions.table-status"),
      operators: defaultStringOperators,
    },
    {
      name: "created",
      label: t("minions.table-created"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
  ];

  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [isSocketOpen, setIsSocketOpen] = useState<boolean>(false);
  const [tasksStore] = useState(new TasksStore());
  const [filterStore] = useState(new TasksFilterStore(filterSchema));

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (data) => (
        <>
          <Link to={`/task/${data.getValue()}`}>
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
    columnHelper.accessor("task_template.title", {
      header: t("minions.table-task-template-title"),
    }),
    columnHelper.accessor("task_template.name", {
      header: t("minions.table-task-template-name"),
    }),
    columnHelper.accessor("target_collection.title", {
      header: t("minions.table-collection"),
      cell: (data) => {
        return <> {data.getValue()} </>;
      },
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
    columnHelper.display({
      header: t("minions.table-status"),
      cell: (data) => {
        const totalMinions = data.row.original?.total_minions ?? 0;
        const statusFailed = data.row.original?.minions_count_by_status?.failed ?? 0;
        const statusSuccess = data.row.original?.minions_count_by_status?.success ?? 0;
        const statusInWork = data.row.original?.minions_count_by_status?.in_work ?? 0;
        const statusPending = data.row.original?.minions_count_by_status?.pending ?? 0;
        const progressStrokeColors = Array.from(
          { length: 10 },
          (_, i) => {
            if (i < Math.ceil(statusSuccess / totalMinions * 10)) {
              return '#52c41a';
            } else if (i < Math.ceil((statusSuccess + statusFailed) / totalMinions * 10)) {
              return '#ff4d4f';
            }
            return '#bfbfbf';
          }
        );
        const popoverContent = <Flex vertical>
          <Flex>{t('minions.tasks-table-status-in-work')}: {statusInWork}</Flex>
          <Flex>{t('minions.tasks-table-status-pending')}: {statusPending}</Flex>
          <Flex>{t('minions.tasks-table-status-failed')}: {statusFailed}</Flex>
          <Flex>{t('minions.tasks-table-status-success')}: {statusSuccess}</Flex>
          <Flex>{t('minions.tasks-table-total-minions')}: {totalMinions}</Flex>
        </Flex>;

        return <Popover content={popoverContent}>
          <Progress
            steps={10}
            percent={(statusSuccess + statusFailed) / totalMinions * 100}
            success={{ percent: statusSuccess / totalMinions * 100 }}
            strokeColor={progressStrokeColors}
            showInfo={false}
          />
        </Popover>;
      },
    }),
    columnHelper.accessor("created", {
      header: t("minions.table-created"),
      cell: (data) => {
        const created: string = pastTimeByUserTZ(data.getValue());
        return <div>{created}</div>;
      },
    }),
  ];

  useEffect(() => {
    const webSocket = new WebSocket(`${apiCoreStore.env?.ws_server_url}/tasks`);
    setSocket(webSocket);
    webSocket.addEventListener("message", (event: MessageEvent<string>) => {
      const parsedTask = JSON.parse(event.data) as TaskListResponseSchema;
      tasksStore.updateTask(parsedTask);
    });
    webSocket.addEventListener("open", () => {
      setIsSocketOpen(true);
    });
    return () => webSocket.close();
  }, []);

  useEffect(() => {
    const accessToken = appStore.authStore?.user?.access_token;
    if (accessToken && socket && isSocketOpen) {
      socket.send(accessToken);
    }
  }, [appStore.authStore?.user, socket, isSocketOpen]);

  useEffect(() => {
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.setCollectionSlug(props.slug);
  }, [props.slug]);

  const handleSearchButtonClick = () => {
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  };

  const handleResetButtonClick = () => {
    filterStore.handleResetFilters();
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  };

  return (
    <Flex style={{ height: "100%" }} vertical>
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
        onLazyLoad={(pagination) => tasksStore.handleLazyLoad(pagination)}
      />
    </Flex>
  );
});
