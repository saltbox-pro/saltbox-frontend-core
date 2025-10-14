import {
  JobResult,
  TaskMinion,
  TaskMinionStatus,
  TaskModel,
  TaskStatus,
} from "@saltbox/saltbox-core-api-client";
import {
  formatTimeByUserTZ,
  PageHeader,
  WebSocketService,
} from "@saltbox/saltbox-frontend-common";
import {
  Breadcrumb,
  Button,
  Flex,
  Popover,
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
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { pastTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
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

const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();
  const [taskStore] = useState(new TaskStore());
  const [selectedCategory, setSelectedCategory] = useState(MinionCategory.All);
  const [minions, setMinions] = useState<Array<TaskMinion>>([]);
  const [taskStatusStats, setTaskStatusStats] = useState<ReactNode>(null);
  const [selectedMinion, setSelectedMinion] = useState<
    TaskMinion | undefined
  >();
  const [selectedMinionJobReturns, setSelectedMinionJobReturns] = useState<
    Array<JobResult>
  >([]);

  const taskStatus: { [key in TaskStatus | "none"]: ReactNode } = {
    [TaskStatus.Created]: (
      <span>
        <ClockCircleOutlined /> {t("task.created")}
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
    const allMinions = Object.keys(taskStore.task?.minions ?? {});
    const byStatus = (minionStatus: TaskMinionStatus) => (mid: string) =>
      taskStore.task?.minions?.[mid]?.status === minionStatus;

    const countMinionsAll = allMinions.length;
    // prettier-ignore
    const countMinionsPending = allMinions.filter(byStatus(TaskMinionStatus.Pending)).length;
    // prettier-ignore
    const countMinionsInWork = allMinions.filter(byStatus(TaskMinionStatus.InWork)).length;
    // prettier-ignore
    const countMinionsFailed = allMinions.filter(byStatus(TaskMinionStatus.Failed)).length;
    // prettier-ignore
    const countMinionsSuccess = allMinions.filter(byStatus(TaskMinionStatus.Success)).length;

    const getStatItemClass = (category: MinionCategory) => {
      const isActiveClass =
        selectedCategory === category ? " " + styles.taskStatItemActive : "";
      return styles.taskStatItem + isActiveClass;
    };

    setTaskStatusStats(
      <Flex gap={5} align="justify" className={styles.taskStatContainer}>
        <div
          className={getStatItemClass(MinionCategory.All)}
          onClick={() => setSelectedCategory(MinionCategory.All)}
        >
          <Statistic
            title={t("task.minions-nav.list-all")}
            value={countMinionsAll}
            valueStyle={{ color: "#3f8600" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Pending)}
          onClick={() => setSelectedCategory(MinionCategory.Pending)}
        >
          <Statistic
            title={t("task.minions-nav.list-pending")}
            value={countMinionsPending}
            valueStyle={{ color: "#faad14" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.InWork)}
          onClick={() => setSelectedCategory(MinionCategory.InWork)}
        >
          <Statistic
            title={t("task.minions-nav.list-in-work")}
            value={countMinionsInWork}
            valueStyle={{ color: "#1964db" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Failed)}
          onClick={() => setSelectedCategory(MinionCategory.Failed)}
        >
          <Statistic
            title={t("task.minions-nav.list-failed")}
            value={countMinionsFailed}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </div>
        <div
          className={getStatItemClass(MinionCategory.Success)}
          onClick={() => setSelectedCategory(MinionCategory.Success)}
        >
          <Statistic
            title={t("task.minions-nav.list-success")}
            value={countMinionsSuccess}
            valueStyle={{ color: "#3f8600" }}
          />
        </div>
      </Flex>
    );
  }, [taskStore.task, selectedCategory]);

  useEffect(() => {
    if (selectedMinion) {
      const minion =
        taskStore.task?.minions?.[
          selectedMinion.master + "_" + selectedMinion.minion_id
        ];
      const minionJobIds = Object.keys(minion?.jobs ?? {})
        .sort()
        .reverse();
      const minionJobReturns = minionJobIds.map((jobId) =>
        taskStore.jobReturns?.find(
          (jobReturn) =>
            jobReturn.jid === jobId &&
            jobReturn.salt_master === minion.master &&
            jobReturn.id === minion.minion_id
        )
      );
      setSelectedMinionJobReturns(minionJobReturns);
      setSelectedMinion(minion);
    }
  }, [taskStore.task, taskStore.jobReturns]);

  useEffect(() => {
    const allMinions = Object.values(taskStore.task?.minions ?? {});
    if (selectedCategory === MinionCategory.All) {
      setMinions(allMinions);
    } else if (selectedCategory === MinionCategory.Pending) {
      // prettier-ignore
      setMinions(allMinions.filter((minion) => minion.status === TaskMinionStatus.Pending));
    } else if (selectedCategory === MinionCategory.InWork) {
      // prettier-ignore
      setMinions(allMinions.filter((minion) => minion.status === TaskMinionStatus.InWork));
    } else if (selectedCategory === MinionCategory.Failed) {
      // prettier-ignore
      setMinions(allMinions.filter((minion) => minion.status === TaskMinionStatus.Failed));
    } else if (selectedCategory === MinionCategory.Success) {
      // prettier-ignore
      setMinions(allMinions.filter((minion) => minion.status === TaskMinionStatus.Success));
    }
  }, [taskStore.task?.minions, selectedCategory]);

  useEffect(() => {
    if (taskStore.error) {
      navigate("/not-found");
    }
  }, [taskStore.error]);

  const [webSocketService] = useState(new WebSocketService<Object>());

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`,
      appStore.authStore?.user?.access_token,
      (update: Object[]) => {
        if (update?.length > 0) {
          taskStore.updateTaskData(update);
        }
      }
    );
    return () => webSocketService.disconnect();
  }, []);

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);

  const handleMinionClick = (minion: TaskMinion) => {
    if (selectedMinion?.minion_id === minion.minion_id) {
      setSelectedMinion(undefined);
      setSelectedMinionJobReturns([]);
    } else {
      const minionJobIds = Object.keys(minion.jobs ?? {})
        .sort()
        .reverse();
      const minionJobReturns = minionJobIds.map((jobId) =>
        taskStore.jobReturns?.find(
          (jobReturn) =>
            jobReturn.jid === jobId &&
            jobReturn.salt_master === minion.master &&
            jobReturn.id === minion.minion_id
        )
      );
      setSelectedMinionJobReturns(minionJobReturns);
      setSelectedMinion(minion);
    }
  };

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
            disabled={
              taskStore.isTaskLoading ||
              taskStore.task?.status === TaskStatus.Finished ||
              taskStore.task?.status === TaskStatus.Postprocessing ||
              taskStore.task?.status === TaskStatus.Running ||
              taskStore.task?.status === TaskStatus.Stopping
            }
            title={t("task.run")}
          ></Button>

          <Button
            onClick={() => taskStore.handleStopTask()}
            color="danger"
            variant="solid"
            icon={<StopOutlined />}
            disabled={
              taskStore.isTaskLoading ||
              taskStore.task?.status === TaskStatus.Created ||
              taskStore.task?.status === TaskStatus.Finished ||
              taskStore.task?.status === TaskStatus.Stopping ||
              taskStore.task?.status === TaskStatus.Stopped
            }
            title={t("task.stop")}
          ></Button>

          <Button
            onClick={() => taskStore.handleRestartFailed()}
            color="orange"
            variant="solid"
            icon={<IssuesCloseOutlined />}
            disabled={
              taskStore.isTaskLoading ||
              taskStore.task?.status === TaskStatus.Stopping ||
              taskStore.task?.status === TaskStatus.Postprocessing ||
              taskStore.task?.status === TaskStatus.Running ||
              taskStore.task?.status === TaskStatus.Created ||
              (taskStore.task?.status === TaskStatus.Stopped &&
                taskStore.failedMinionsCount === 0) ||
              (taskStore.task?.status === TaskStatus.Finished &&
                taskStore.failedMinionsCount === 0)
            }
            title={t("task.restart-failed")}
          ></Button>
        </div>

        <div className={styles.taskDetailItem}>
          <span className={styles.taskDetailLabel}>{t("task.status")}:</span>
          <span className={styles.taskDetailValue}>
            {taskStatus[taskStore.task?.status ?? "none"] ?? (
              <Skeleton.Input size="small" />
            )}
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

      {taskStatusStats}

      <TaskMinions
        minions={minions}
        collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
        isLoading={taskStore.isTaskLoading}
        onMinionClick={handleMinionClick}
      />

      <MinionView
        selectedMinion={selectedMinion}
        selectedMinionJobReturns={selectedMinionJobReturns}
        onClose={() => setSelectedMinion(undefined)}
      />
    </>
  );
});

export default TaskPage;
