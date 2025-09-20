import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Badge, Breadcrumb, Button, Tabs, TabsProps } from "antd";
import {
  CaretRightOutlined,
  HomeOutlined,
  IssuesCloseOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { JobResult, TaskModel, TaskStatus } from "@saltbox/saltbox-core-api-client";
import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { TaskJobReturns } from "./-components/task-job-returns/task-job-returns";
import { TaskJobs } from "./-components/task-jobs/task-jobs";
import { TaskMinions } from "./-components/task-minions/task-minions";
import { TaskStat } from "./-components/task-stat/task-stat";
import { Link, useNavigate, useParams } from "react-router";
import styles from "./index.module.css";

const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();
  const [taskStore] = useState(new TaskStore());

  useEffect(() => {
    if (taskId) {
      taskStore.reload(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskStore.error) {
      navigate("/not-found");
    }
  }, [taskStore.error]);

  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [isSocketOpen, setIsSocketOpen] = useState<boolean>(false);

  useEffect(() => {
    const webSocket = new WebSocket(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`,
    );
    setSocket(webSocket);
    webSocket.addEventListener("message", (event: MessageEvent<string>) => {
      const parsedData = JSON.parse(event.data);
      if (parsedData?.retcode !== undefined) {
        taskStore.addJobReturn(parsedData as JobResult);
      } else if (parsedData?.jobs !== undefined) {
        runInAction(() => {
          taskStore.task = parsedData as TaskModel;
        });
      }
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

  const taskTabs: TabsProps["items"] = [
    {
      key: "minions",
      label: t("minions.title"),
      children: (
        <TaskMinions
          minions={toJS(Object.values(taskStore.task?.minions ?? {}))}
          collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
          isLoading={taskStore.isTaskLoading}
        />
      ),
    },
    {
      key: "jobs",
      label: (
        <span>
          {t("mainmenu.jobs")}
          {taskStore?.task?.jobs?.length !== undefined &&
            taskStore.jobsCount > 0 && (
              <Badge
                color="blue"
                count={taskStore.jobsCount}
                size="small"
                style={{ marginTop: -11 }}
              />
            )}
        </span>
      ),
      children: <TaskJobs task={toJS(taskStore.task)} isLoading={taskStore.isTaskLoading} />,
    },
    {
      key: "job-returns",
      label: t("task.job-returns"),
      children: <TaskJobReturns jobReturns={toJS(taskStore.jobReturns)} isLoading={taskStore.isTaskLoading} />,
    },
  ];

  return (
    <>
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("minions.title"),
          },
          ...(taskStore.task?.target_collection ? [
            {
              title: (
                <Link
                  to={{
                    pathname: `/minions/${taskStore.task.target_collection.slug}`
                  }}
                >
                  {taskStore.task.target_collection.title}
                </Link>
              ),
            }
          ] : [
            {
              title: (
                <Link
                  to={{
                    pathname: `/minions/root`
                  }}
                >
                  {taskStore.task ? t("minions.title") : "..."}
                </Link>
              ),
            }
          ]),
          {
            title: taskStore.task ? t("task.title", { taskId: taskId }) : "...",
          },
        ]}
      />

      <PageHeader title={t("task.title", { taskId: taskId })} />

      <TaskStat
        task={toJS(taskStore.task)}
        jobReturns={toJS(taskStore.jobReturns)}
      />

      <div>
        {(taskStore.task?.status === TaskStatus.Created ||
          taskStore.task?.status === TaskStatus.Stopped) && (
            <Button
              onClick={() => taskStore.handleRunTask()}
              color="primary"
              variant="solid"
              icon={<CaretRightOutlined />}
              disabled={taskStore.isTaskLoading}
            >
              {t("task.run")}
            </Button>
          )}
        {(taskStore.task?.status === TaskStatus.Postprocessing) && (
          <Button
            onClick={() => taskStore.handleStopTask()}
            color="default"
            variant="solid"
            icon={<StopOutlined />}
            disabled={true}
          >
            {t("task.postprocessing")}
          </Button>
        )}
        {(taskStore.task?.status === TaskStatus.Stopping) && (
          <Button
            onClick={() => taskStore.handleStopTask()}
            color="default"
            variant="solid"
            icon={<StopOutlined />}
            disabled={true}
          >
            {t("task.stopping")}
          </Button>
        )}
        {(taskStore.task?.status === TaskStatus.Running) && (
          <Button
            onClick={() => taskStore.handleStopTask()}
            color="danger"
            variant="solid"
            icon={<StopOutlined />}
            disabled={taskStore.isTaskLoading}
          >
            {t("task.stop")}
          </Button>
        )}
        {taskStore.task?.status === TaskStatus.Finished &&
          taskStore.failedMinionsCount > 0 && (
            <Button
              onClick={() => taskStore.handleRestartFailed()}
              color="danger"
              variant="solid"
              icon={<IssuesCloseOutlined />}
              disabled={taskStore.isTaskLoading}
            >
              {t("task.restart-failed")}
            </Button>
          )}
      </div>

      <Tabs
        className={styles.taskTabs}
        defaultActiveKey="minions"
        items={taskTabs}
      ></Tabs>
    </>
  );
});

export default TaskPage;
