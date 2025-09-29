import { JobResult, TaskMinion, TaskMinionStatus, TaskModel, TaskStatus } from "@saltbox/saltbox-core-api-client";
import { FastTableListed, formatTimeByUserTZ, PageHeader } from "@saltbox/saltbox-frontend-common";
import { Breadcrumb, Button, Card, Col, Drawer, Flex, Popover, Row, Skeleton, Spin, Statistic, StepProps, Steps } from "antd";
import { CaretRightOutlined, CheckCircleOutlined, ClockCircleOutlined, HomeOutlined, IssuesCloseOutlined, QuestionCircleOutlined, StopOutlined, SyncOutlined } from "@ant-design/icons";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { pastTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import styles from "./index.module.css";
import { TaskMinions } from "./-components/task-minions/task-minions";


const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();
  const [taskStore] = useState(new TaskStore());
  const [minionsSelectedStatus, setMinionsSelectedStatus] = useState(0);
  const [minions, setMinions] = useState<Array<TaskMinion>>([]);
  const [taskStatusStats, setTaskStatusStats] = useState<ReactNode>(null);
  const [selectedMinion, setSelectedMinion] = useState<TaskMinion | undefined>();

  const taskStatus: { [key in TaskStatus | "none"]: ReactNode } = {
    [TaskStatus.Created]: (
      <span>
        <ClockCircleOutlined />
        {t("task.created")}
      </span>
    ),
    [TaskStatus.Finished]: (
      <>
        <CheckCircleOutlined /> {t("task.finished")}
      </>
    ),
    [TaskStatus.Running]: (
      <span>
        <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
        {t("task.running")}
      </span>
    ),
    [TaskStatus.Stopping]: (
      <span>
        <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
        {t("task.stopping")}
      </span>
    ),
    [TaskStatus.Stopped]: (
      <span>
        <StopOutlined /> {t("task.stopped")}
      </span>
    ),
    [TaskStatus.Postprocessing]: (
      <span>
        <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
        {t("task.post-processing")}
      </span>
    ),
    none: (
      <span>
        <QuestionCircleOutlined /> {t("task.unknown")}
      </span>
    ),
  };

  useEffect(() => {
    if (taskId) {
      taskStore.reload(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    const countMinionsAll = Object.keys(taskStore.task?.minions ?? {}).length;
    const countMinionsPending = Object.keys(taskStore.task?.minions ?? {}).filter(mid => taskStore.task?.minions?.[mid]?.status === TaskMinionStatus.Pending).length;
    const countMinionsInWork = Object.keys(taskStore.task?.minions ?? {}).filter(mid => taskStore.task?.minions?.[mid]?.status === TaskMinionStatus.InWork).length;
    const countMinionsFailed = Object.keys(taskStore.task?.minions ?? {}).filter(mid => taskStore.task?.minions?.[mid]?.status === TaskMinionStatus.Failed).length;
    const countMinionsSuccess = Object.keys(taskStore.task?.minions ?? {}).filter(mid => taskStore.task?.minions?.[mid]?.status === TaskMinionStatus.Success).length;

    setTaskStatusStats(
      <Flex gap={5} align="justify" className={styles.taskStatContainer}>
        <div className={styles.taskStatItem + (minionsSelectedStatus === 0 ? " " + styles.taskStatItemActive : "")} onClick={() => setMinionsSelectedStatus(0)}>
          <Statistic
            title={t("task.minions-nav.list-all")}
            value={countMinionsAll}
            valueStyle={{ color: '#3f8600' }}
          />
        </div>
        <div className={styles.taskStatItem + (minionsSelectedStatus === 1 ? " " + styles.taskStatItemActive : "")} onClick={() => setMinionsSelectedStatus(1)}>
          <Statistic
            title={t("task.minions-nav.list-pending")}
            value={countMinionsPending}
            valueStyle={{ color: '#faad14' }}
          />
        </div>
        <div className={styles.taskStatItem + (minionsSelectedStatus === 2 ? " " + styles.taskStatItemActive : "")} onClick={() => setMinionsSelectedStatus(2)}>
          <Statistic
            title={t("task.minions-nav.list-in-work")}
            value={countMinionsInWork}
            valueStyle={{ color: '#1964db' }}
          />
        </div>
        <div className={styles.taskStatItem + (minionsSelectedStatus === 3 ? " " + styles.taskStatItemActive : "")} onClick={() => setMinionsSelectedStatus(3)}>
          <Statistic
            title={t("task.minions-nav.list-failed")}
            value={countMinionsFailed}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </div>
        <div className={styles.taskStatItem + (minionsSelectedStatus === 4 ? " " + styles.taskStatItemActive : "")} onClick={() => setMinionsSelectedStatus(4)}>
          <Statistic
            title={t("task.minions-nav.list-success")}
            value={countMinionsSuccess}
            valueStyle={{ color: '#3f8600' }}
          />
        </div>
      </Flex>
    );
  }, [taskStore.task, minionsSelectedStatus]);

  useEffect(() => {
    if (minionsSelectedStatus === 0) {
      setMinions(Object.values(taskStore.task?.minions ?? {}));
    } else if (minionsSelectedStatus === 1) {
      setMinions(Object.values(taskStore.task?.minions ?? {}).filter(minion => minion.status === TaskMinionStatus.Pending));
    } else if (minionsSelectedStatus === 2) {
      setMinions(Object.values(taskStore.task?.minions ?? {}).filter(minion => minion.status === TaskMinionStatus.InWork));
    } else if (minionsSelectedStatus === 3) {
      setMinions(Object.values(taskStore.task?.minions ?? {}).filter(minion => minion.status === TaskMinionStatus.Failed));
    } else if (minionsSelectedStatus === 4) {
      setMinions(Object.values(taskStore.task?.minions ?? {}).filter(minion => minion.status === TaskMinionStatus.Success));
    }
  }, [taskStore.task?.minions, minionsSelectedStatus]);

  useEffect(() => {
    if (taskStore.error) {
      navigate("/not-found");
    }
  }, [taskStore.error]);

  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [isSocketOpen, setIsSocketOpen] = useState<boolean>(false);

  useEffect(() => {
    const webSocket = new WebSocket(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`
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

  const handleMinionClick = (minion: TaskMinion) => {
    if (selectedMinion?.minion_id === minion.minion_id) {
      setSelectedMinion(undefined);
    } else {
      setSelectedMinion(minion);
    }
  };

  return <>
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
                  pathname: `/minions/${taskStore.task.target_collection.slug}`,
                }}
              >
                {taskStore.task.target_collection.title}
              </Link>
            ),
          },
          {
            title: (
              <Link
                to={{
                  pathname: `/minions/${taskStore.task.target_collection.slug}`,
                  search: `?tab=tasks`,
                }}
              >
                {t("task.breadcrumbs-tasks")}
              </Link>
            ),
          }
        ] : [
          {
            title: (
              <Link
                to={{
                  pathname: `/minions/root`,
                }}
              >
                {taskStore.task ? t("minions.title") : "..."}
              </Link>
            ),
          },
          {
            title: (
              <Link
                to={{
                  pathname: `/minions/root`,
                  search: `?tab=tasks`,
                }}
              >
                {t("task.breadcrumbs-tasks")}
              </Link>
            ),
          }
        ]),
        {
          title: taskStore.task?.task_template?.title
            ? t("task.breadcrumbs-title-template", { templateName: taskStore.task.task_template.title?.toLowerCase(), taskId: taskId })
            : t("task.breadcrumbs-title-empty", { taskId: taskId ?? "..." }),
        },
      ]}
    />

    <PageHeader
      title={t("task.page-title", {
        templateName: taskStore.task?.task_template?.title ?? "...",
        taskId: taskId ?? "..."
      })}
    />

    <div className={styles.taskDetailsContainer}>

      <div className={styles.taskActionButtonsContainer}>
        <Button
          onClick={() => taskStore.handleRunTask()}
          color="primary"
          variant="solid"
          icon={<CaretRightOutlined />}
          disabled={
            taskStore.isTaskLoading
            || taskStore.task?.status === TaskStatus.Finished
            || taskStore.task?.status === TaskStatus.Postprocessing
            || taskStore.task?.status === TaskStatus.Running
            || taskStore.task?.status === TaskStatus.Stopping
          }
          title={t("task.run")}
        ></Button>

        <Button
          onClick={() => taskStore.handleStopTask()}
          color="danger"
          variant="solid"
          icon={<StopOutlined />}
          disabled={
            taskStore.isTaskLoading
            || taskStore.task?.status === TaskStatus.Created
            || taskStore.task?.status === TaskStatus.Finished
            || taskStore.task?.status === TaskStatus.Stopping
            || taskStore.task?.status === TaskStatus.Stopped
          }
          title={t("task.stop")}
        ></Button>

        <Button
          onClick={() => taskStore.handleRestartFailed()}
          color="orange"
          variant="solid"
          icon={<IssuesCloseOutlined />}
          disabled={
            taskStore.isTaskLoading
            || taskStore.task?.status === TaskStatus.Stopping
            || taskStore.task?.status === TaskStatus.Postprocessing
            || taskStore.task?.status === TaskStatus.Running
            || taskStore.task?.status === TaskStatus.Created
            || (taskStore.task?.status === TaskStatus.Stopped && taskStore.failedMinionsCount === 0)
            || (taskStore.task?.status === TaskStatus.Finished && taskStore.failedMinionsCount === 0)
          }
          title={t("task.restart-failed")}
        ></Button>
      </div>

      <div className={styles.taskDetailItem}>
        <span className={styles.taskDetailLabel}>{t("task.status")}:</span>
        <span className={styles.taskDetailValue}>
          {taskStatus[taskStore.task?.status ?? "none"] ?? <Skeleton.Input size="small" />}
        </span>
      </div>
      <div className={styles.taskDetailItem}>
        <span className={styles.taskDetailLabel}>{t("task.created")}:</span>
        <span className={styles.taskDetailValue}>
          <Popover
            content={formatTimeByUserTZ(taskStore.task?.created ?? 0)}
          >
            {pastTimeByUserTZ(taskStore.task?.created ?? 0) ?? <Skeleton.Input size="small" />}
          </Popover>
        </span>
      </div>
      <div className={styles.taskDetailItem}>
        <span className={styles.taskDetailLabel}>{t("task.user")}:</span>
        <span className={styles.taskDetailValue}>
          {taskStore.task?.user?.email ?? <Skeleton.Input size="small" />}
        </span>
      </div>
      <div className={styles.taskDetailItem}>
        <span className={styles.taskDetailLabel}>
          {t("task.task-more-info")}
        </span>
      </div>
    </div>

    {taskStatusStats}

    <TaskMinions
      minions={minions}
      collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
      isLoading={taskStore.isTaskLoading}
      onMinionClick={handleMinionClick}
    />

    <Drawer
      open={selectedMinion !== undefined}
      onClose={() => setSelectedMinion(undefined)}
      mask={false}
      title={t("task.minion.title")}
    >
      {selectedMinion?.minion_id}
    </Drawer>
  </>;
});

export default TaskPage;
