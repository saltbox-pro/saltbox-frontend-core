import {
  JobReturnModel,
  TaskMinion,
  TaskMinionStatus,
  TaskStatus,
} from "@saltbox/saltbox-core-api-client";
import {
  formatTimeByUserTZ,
  PageHeader,
  WebSocketService,
  pastTimeByUserTZ,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import {
  Breadcrumb,
  Button,
  Flex,
  Skeleton,
  Spin,
  Statistic,
} from "antd";
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  IssuesCloseOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { TaskMinions } from "./-components/task-minions/task-minions";
import { MinionView } from "./-components/minion-view/minion-view";
import styles from "./index.module.css";

enum MinionCategory {
  All,
  Pending,
  InWork,
  Failed,
  Success,
}

const useMinions = (taskStore: TaskStore) => {
  const { t } = useTranslation();
  const [selectedMinionCategory, setSelectedMinionCategory] = useState(
    MinionCategory.All
  );

  const minionsOfCategory = useMemo(() => {
    const allMinions = Object.values(taskStore.task?.minions ?? {});
    const getMinionsByStatus = (status: TaskMinionStatus) =>
      allMinions.filter((minion) => minion.status === status);

    if (selectedMinionCategory === MinionCategory.All) {
      return allMinions;
    }
    if (selectedMinionCategory === MinionCategory.Pending) {
      return getMinionsByStatus(TaskMinionStatus.Pending);
    }
    if (selectedMinionCategory === MinionCategory.InWork) {
      return getMinionsByStatus(TaskMinionStatus.InWork);
    }
    if (selectedMinionCategory === MinionCategory.Failed) {
      return getMinionsByStatus(TaskMinionStatus.Failed);
    }
    if (selectedMinionCategory === MinionCategory.Success) {
      return getMinionsByStatus(TaskMinionStatus.Success);
    }
    return [];
  }, [taskStore.task?.minions, selectedMinionCategory]);

  const minionCategoryStats = useMemo(() => {
    const allMinions = Object.keys(taskStore.task?.minions ?? {});
    const getStatusCount = (status: TaskMinionStatus) => {
      return allMinions.filter(
        (mid: string) => taskStore.task?.minions?.[mid]?.status === status
      ).length;
    };

    const countMinionsAll = allMinions.length;
    const countMinionsPending = getStatusCount(TaskMinionStatus.Pending);
    const countMinionsInWork = getStatusCount(TaskMinionStatus.InWork);
    const countMinionsFailed = getStatusCount(TaskMinionStatus.Failed);
    const countMinionsSuccess = getStatusCount(TaskMinionStatus.Success);

    const getStatItemClass = (category: MinionCategory) => {
      const isActiveClass =
        selectedMinionCategory === category
          ? " " + styles.taskStatItemActive
          : "";
      return styles.taskStatItem + isActiveClass;
    };

    return (
      <Flex gap={5} align="justify" className={styles.taskStatContainer}>
        <div
          className={getStatItemClass(MinionCategory.All)}
          onClick={() => setSelectedMinionCategory(MinionCategory.All)}
        >
          <Statistic
            title={t("task.minions-nav.list-all")}
            value={countMinionsAll}
            valueStyle={{ color: "#3f8600" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Pending)}
          onClick={() => setSelectedMinionCategory(MinionCategory.Pending)}
        >
          <Statistic
            title={t("task.minions-nav.list-pending")}
            value={countMinionsPending}
            valueStyle={{ color: "#faad14" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.InWork)}
          onClick={() => setSelectedMinionCategory(MinionCategory.InWork)}
        >
          <Statistic
            title={t("task.minions-nav.list-in-work")}
            value={countMinionsInWork}
            valueStyle={{ color: "#1964db" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Failed)}
          onClick={() => setSelectedMinionCategory(MinionCategory.Failed)}
        >
          <Statistic
            title={t("task.minions-nav.list-failed")}
            value={countMinionsFailed}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Success)}
          onClick={() => setSelectedMinionCategory(MinionCategory.Success)}
        >
          <Statistic
            title={t("task.minions-nav.list-success")}
            value={countMinionsSuccess}
            valueStyle={{ color: "#3f8600" }}
          />
        </div>
      </Flex>
    );
  }, [taskStore.task, selectedMinionCategory]);

  return {
    minions: {
      value: minionsOfCategory,
      selectedCategory: selectedMinionCategory,
      updateSelectedCategory: setSelectedMinionCategory,
    },
    minionCategoryStats,
  };
};

const useSelectedMinion = (taskStore: TaskStore) => {
  const [selectedMinion, setSelectedMinion] = useState<
    TaskMinion | undefined
  >();
  const [selectedMinionJobReturns, setSelectedMinionJobReturns] = useState<
    Array<JobReturnModel>
  >([]);

  const getStoredMinion = (minion: TaskMinion) => {
    return taskStore.task?.minions?.[minion.master + "_" + minion.minion_id];
  };

  const getMinionJobReturns = (minion?: TaskMinion) => {
    const minionJobIds = Object.keys(minion?.jobs ?? {})
      .sort()
      .reverse();
    return minionJobIds
      .map((jobId) =>
        taskStore.jobReturns?.find(
          (jobReturn) => jobReturn.jid === jobId &&
            jobReturn.salt_master === minion.master &&
            jobReturn.minion_id === minion.minion_id
        )
      ).filter((jobReturn) => jobReturn !== undefined) as JobReturnModel[];
  };

  useEffect(() => {
    if (selectedMinion) {
      const minion = getStoredMinion(selectedMinion);
      const minionJobReturns = getMinionJobReturns(minion);
      setSelectedMinionJobReturns(minionJobReturns);
      setSelectedMinion(minion);
    }
  }, [taskStore.task, taskStore.jobReturns]);

  const updateSelectedMinion = (minion: TaskMinion) => {
    if (selectedMinion?.minion_id === minion.minion_id) {
      setSelectedMinionJobReturns([]);
      setSelectedMinion(undefined);
    } else {
      const minionJobReturns = getMinionJobReturns(minion);
      setSelectedMinionJobReturns(minionJobReturns);
      setSelectedMinion(minion);
    }
  };

  const clear = () => {
    setSelectedMinion(undefined);
  };

  return {
    value: selectedMinion,
    jobReturns: selectedMinionJobReturns,
    update: updateSelectedMinion,
    clear,
  };
};

const useTaskPermissions = (taskStore: TaskStore) => {
  const isTaskLoading = taskStore.isTaskLoading;
  const taskStatus = taskStore.task?.status;

  const canRun =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.Postprocessing &&
    taskStatus !== TaskStatus.Running &&
    taskStatus !== TaskStatus.Stopping;

  const canStop =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Created &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.Stopping &&
    taskStatus !== TaskStatus.Stopped;

  const canRestartFailed =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Stopping &&
    taskStatus !== TaskStatus.Postprocessing &&
    taskStatus !== TaskStatus.Running &&
    taskStatus !== TaskStatus.Created &&
    (taskStatus !== TaskStatus.Stopped || !!taskStore.failedMinionsCount) &&
    (taskStatus !== TaskStatus.Finished || !!taskStore.failedMinionsCount);

  return { canRun, canStop, canRestartFailed };
};

const useWebSocket = (taskId: string, onUpdate: (update: Object[]) => void) => {
  const [webSocketService] = useState(new WebSocketService<Object>());

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: onUpdate
      }
    );
    return () => webSocketService.disconnect();
  }, []);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);
};

const TaskStatusIndicator = ({ status }: { status?: TaskStatus | "none" }) => {
  const { t } = useTranslation();

  switch (status) {
    case TaskStatus.Created:
      return (
        <span>
          <ClockCircleOutlined /> {t("task.created")}
        </span>
      );
    case TaskStatus.Finished:
      return (
        <>
          <CheckCircleOutlined /> {t("task.finished")}
        </>
      );
    case TaskStatus.Running:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
          {t("task.running")}
        </span>
      );
    case TaskStatus.Stopping:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
          {t("task.stopping")}
        </span>
      );
    case TaskStatus.Stopped:
      return (
        <span>
          <StopOutlined /> {t("task.stopped")}
        </span>
      );
    case TaskStatus.Postprocessing:
      return (
        <span>
          <Spin indicator={<SyncOutlined spin />} size="small" />{" "}
          {t("task.post-processing")}
        </span>
      );
    case "none":
      return (
        <span>
          <QuestionCircleOutlined /> {t("task.unknown")}
        </span>
      );
    default:
      return <Skeleton.Input size="small" />;
  }
};

const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();

  const [taskStore] = useState(new TaskStore());
  const { minions, minionCategoryStats } = useMinions(taskStore);
  const selectedMinion = useSelectedMinion(taskStore);
  const taskPermissions = useTaskPermissions(taskStore);

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

  useWebSocket(taskId, (update) => {
    if (update?.length > 0) {
      taskStore.updateTaskData(update);
    }
  });

  return (
    <>
      <Breadcrumb
        items={[
          {
            title: <Link to="/minions"><HomeOutlined /></Link>,
          },
          {
            title: t("minions.title"),
          },
          ...(taskStore.task?.target_collection
            ? [
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
              },
            ]
            : [
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
              },
            ]),
          {
            title: taskStore.task?.task_template?.title
              ? t("task.breadcrumbs-title-template", {
                templateName:
                  taskStore.task.task_template.title?.toLowerCase(),
                taskId: taskId,
              })
              : t("task.breadcrumbs-title-empty", { taskId: taskId ?? "..." }),
          },
        ]}
      />

      <PageHeader
        title={t("task.page-title", {
          templateName: taskStore.task?.task_template?.title ?? "...",
          taskId: taskId ?? "...",
        })}
      />

      <div className={styles.taskDetailsContainer}>
        <div className={styles.taskActionButtonsContainer}>
          <Button
            onClick={() => taskStore.handleRunTask()}
            color="primary"
            variant="solid"
            icon={<CaretRightOutlined />}
            disabled={!taskPermissions.canRun}
            title={t("task.run")}
          ></Button>

          <Button
            onClick={() => taskStore.handleStopTask()}
            color="danger"
            variant="solid"
            icon={<StopOutlined />}
            disabled={!taskPermissions.canStop}
            title={t("task.stop")}
          ></Button>

          <Button
            onClick={() => taskStore.handleRestartFailed()}
            color="orange"
            variant="solid"
            icon={<IssuesCloseOutlined />}
            disabled={!taskPermissions.canRestartFailed}
            title={t("task.restart-failed")}
          ></Button>
        </div>

        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.status")}:</span>
          <span className={styles.taskDetailValue}>
            <TaskStatusIndicator status={taskStore.task?.status ?? "none"} />
          </span>
        </div>
        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.created")}:</span>
          <span className={styles.taskDetailValue}>
            <Popover content={formatTimeByUserTZ(taskStore.task?.created ?? 0)}>
              {pastTimeByUserTZ(taskStore.task?.created ?? 0) ?? (
                <Skeleton.Input size="small" />
              )}
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

      {minionCategoryStats}

      <TaskMinions
        minions={minions.value}
        collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
        isLoading={taskStore.isTaskLoading}
        onMinionClick={selectedMinion.update}
      />

      <MinionView
        selectedMinion={selectedMinion.value}
        selectedMinionJobReturns={selectedMinion.jobReturns}
        onClose={selectedMinion.clear}
      />
    </>
  );
});

export default TaskPage;
