import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import {
  JobReturnModel,
  JobsListResponse,
  TaskMinionModel,
  TaskMinionStatus,
  TaskModel,
  TaskStatus,
  TaskType,
} from "@saltbox/saltbox-core-api-client";
import {
  formatTimeByUserTZ,
  PageHeader,
  pastTimeByUserTZ,
  Popover,
  WebSocketMessage,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Skeleton, Statistic } from "antd";
import { observer } from "mobx-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import {
  MinionTaskResultsDrawer,
  useMinionTaskResultsDrawer,
} from "saltbox-core/widgets/minion-task-results-drawer";

import { TaskMinions } from "./-components/task-minions/task-minions";
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
  const [selectedMinionCategory, setSelectedMinionCategory] = useState(MinionCategory.All);

  const minionsOfCategory = useMemo(() => {
    const getMinionsByStatus = (status: TaskMinionStatus) => {
      return taskStore.minions?.filter((minion) => minion.status === status);
    };
    if (selectedMinionCategory === MinionCategory.All) {
      return taskStore.minions;
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
  }, [taskStore.minions, selectedMinionCategory]);

  const minionCategoryStats = useMemo(() => {
    const getMinionStatusCount = (status: TaskMinionStatus) => {
      return taskStore.minions?.filter((minion) => {
        return minion.status === status;
      }).length;
    };

    const countMinionsAll = taskStore.minions?.length ?? 0;
    const countMinionsPending = getMinionStatusCount(TaskMinionStatus.Pending);
    const countMinionsInWork = getMinionStatusCount(TaskMinionStatus.InWork);
    const countMinionsFailed = getMinionStatusCount(TaskMinionStatus.Failed);
    const countMinionsSuccess = getMinionStatusCount(TaskMinionStatus.Success);

    const getStatItemClass = (category: MinionCategory) => {
      const isActiveClass =
        selectedMinionCategory === category ? " " + styles.taskStatItemActive : "";
      return styles.taskStatItem + isActiveClass;
    };

    return (
      <Flex gap={5} align="justify" className={styles.taskStatContainer}>
        <div
          className={getStatItemClass(MinionCategory.All)}
          onClick={() => setSelectedMinionCategory(MinionCategory.All)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMinionCategory(MinionCategory.All);
            }
          }}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMinionCategory(MinionCategory.Pending);
            }
          }}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMinionCategory(MinionCategory.InWork);
            }
          }}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMinionCategory(MinionCategory.Failed);
            }
          }}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMinionCategory(MinionCategory.Success);
            }
          }}
        >
          <Statistic
            title={t("task.minions-nav.list-success")}
            value={countMinionsSuccess}
            valueStyle={{ color: "#3f8600" }}
          />
        </div>
      </Flex>
    );
  }, [taskStore.task, taskStore.minions, selectedMinionCategory]);

  return {
    minions: {
      value: minionsOfCategory,
      selectedCategory: selectedMinionCategory,
      updateSelectedCategory: setSelectedMinionCategory,
    },
    minionCategoryStats,
  };
};

const useTaskPermissions = (taskStore: TaskStore) => {
  const isTaskLoading = taskStore.isTaskLoading;
  const taskStatus = taskStore.task?.status?.type;

  const canRun =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.WaitMinions &&
    taskStatus !== TaskStatus.Running &&
    taskStatus !== TaskStatus.Stopping;
  const canStop =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Created &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.Stopping &&
    taskStatus !== TaskStatus.Stopped;
  const canRestartFailed =
    (!isTaskLoading &&
      taskStatus !== TaskStatus.Stopping &&
      taskStatus !== TaskStatus.Created &&
      taskStore.task?.minions_count?.failed > 0) ||
    (taskStore.task?.minions_count?.pending > 0 && taskStatus === TaskStatus.Finished);
  return { canRun, canStop, canRestartFailed };
};

type TaskWebSocketMessage = TaskModel | TaskMinionModel | JobReturnModel | JobsListResponse;

const useWebSocket = (
  taskId: string,
  onUpdate: (messages: Array<WebSocketMessage<TaskWebSocketMessage>>) => void
) => {
  const [webSocketService] = useState(new WebSocketService<TaskWebSocketMessage>());

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: onUpdate,
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

const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();

  const [taskStore] = useState(new TaskStore());
  const { minions, minionCategoryStats } = useMinions(taskStore);
  const minionTaskResultsDrawer = useMinionTaskResultsDrawer(taskStore);
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

  useWebSocket(taskId, (messages) => {
    if (messages?.length > 0) {
      taskStore.updateTasks(
        messages
          .filter((message) => message.message_tag === "task")
          .map((message) => message.payload) as TaskModel[]
      );
      taskStore.updateJobs(
        messages
          .filter((message) => message.message_tag === "job")
          .map((message) => message.payload) as JobsListResponse[]
      );
      taskStore.updateMinions(
        messages
          .filter((message) => message.message_tag === "task-minion")
          .map((message) => message.payload) as TaskMinionModel[]
      );
      taskStore.updateJobReturns(
        messages
          .filter((message) => message.message_tag === "job-return")
          .map((message) => message.payload) as JobReturnModel[]
      );
    }
  });

  return (
    <>
      <PageHeader
        title={t("task.page-title", {
          templateName: taskStore.task?.task_template?.title ?? "...",
          taskId: taskId ?? "...",
        })}
      />

      <Flex className={styles.taskDetailsContainer} align="center" wrap gap={24}>
        <Flex gap={7}>
          <Button
            onClick={taskStore.handleRunTask}
            color="primary"
            variant="solid"
            icon={<CaretRightOutlined />}
            disabled={!taskPermissions.canRun}
            title={t("task.run")}
          />

          <Button
            onClick={taskStore.handleStopTask}
            color="danger"
            variant="solid"
            icon={<StopOutlined />}
            disabled={!taskPermissions.canStop}
            title={t("task.stop")}
          />

          <Button
            onClick={taskStore.handleRestartFailed}
            color="orange"
            variant="solid"
            icon={<IssuesCloseOutlined />}
            disabled={!taskPermissions.canRestartFailed}
            title={t("task.restart-failed")}
          />
        </Flex>

        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.type")}:</span>
          <span className={styles.taskDetailValue}>
            {taskStore.task?.task_type === TaskType.Classic
              ? t("task.type-classic")
              : t("task.type-policy")}
          </span>
        </div>
        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.status")}:</span>
          <span className={styles.taskDetailValue}>
            <TaskStatusIndicator status={taskStore.task?.status?.type ?? "none"} />
          </span>
        </div>
        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.created")}:</span>
          <span className={styles.taskDetailValue}>
            <Popover content={formatTimeByUserTZ(taskStore.task?.created ?? 0)}>
              {pastTimeByUserTZ(taskStore.task?.created ?? 0) ?? <Skeleton.Input size="small" />}
            </Popover>
          </span>
        </div>
        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.user")}:</span>
          <span className={styles.taskDetailValue}>
            {taskStore.task?.user?.name ?? <Skeleton.Input size="small" />}
          </span>
        </div>
        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.task-more-info")}</span>
        </div>
      </Flex>

      {minionCategoryStats}

      <TaskMinions
        minions={minions.value}
        collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
        isLoading={taskStore.isTaskLoading}
        onMinionClick={minionTaskResultsDrawer.open}
      />

      <MinionTaskResultsDrawer
        isOpened={minionTaskResultsDrawer.isOpened}
        openedId={minionTaskResultsDrawer.openedId}
        selectedMinion={minionTaskResultsDrawer.selectedMinion}
        selectedMinionJobReturns={minionTaskResultsDrawer.selectedMinionJobReturns}
        slug={minionTaskResultsDrawer.slug}
        onClose={minionTaskResultsDrawer.close}
        clearData={minionTaskResultsDrawer.clearData}
      />
    </>
  );
});

export default TaskPage;
