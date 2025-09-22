import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Flex, Tag } from "antd";
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

const defaultNumberOperators = [
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
    name: "<",
    value: "<",
    label: "<",
  },
  {
    name: ">",
    value: ">",
    label: ">",
  },
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
    label: "in",
  },
  {
    name: "notIn",
    value: "notIn",
    label: "notIn",
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
      selectOptions: [{ label: "User", value: "rest" }, { label: 'Scheduler', value: "scheduler" }],
      selectFieldNames: { label: "label", value: "value" },
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
    columnHelper.accessor("user.name", {
      header: t("minions.table-user"),
    }),
    columnHelper.accessor("status", {
      header: t("minions.table-status"),
      cell: (data) => {
        if (data.getValue()) {
          switch (data.getValue()) {
            case "created":
              return (
                <Tag color="yellow">{t("minions.tasks-table-created")}</Tag>
              );
            case "running":
              return <Tag color="blue">{t("minions.tasks-table-running")}</Tag>;
            case "stopped":
              return <Tag color="red">{t("minions.tasks-table-stopped")}</Tag>;
            case "finished":
              return (
                <Tag color="green">{t("minions.tasks-table-finished")}</Tag>
              );
            case "stopping":
              return (
                <Tag color="orange">{t("minions.tasks-table-stopping")}</Tag>
              );
            case "postprocessing":
              return (
                <Tag color="purple">
                  {t("minions.tasks-table-postprocessing")}
                </Tag>
              );
          }
        }
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
    tasksStore.loadTasks(props.slug);
  }, [props.slug, tasksStore]);

  useEffect(() => {
    tasksStore.mongoDBQuery = filterStore.searchMongoDBQuery;
    tasksStore.handleSearch(props.slug);
  }, [filterStore.searchMongoDBQuery]);

  return (
    <Flex style={{ height: "100%" }} vertical>
      <TasksQueryBuilder
        filterStore={filterStore}
      />
      <TasksTable
        columns={columns}
        getRowId={(row) => row.id}
        data={toJS(tasksStore.tasks)}
        total={tasksStore.total}
        pagination={tasksStore.pagination}
        onLazyLoad={(pagination) => tasksStore.handleLazyLoad(pagination)}
      ></TasksTable>
    </Flex>
  );
});
