import { formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { Divider, Flex, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { OpenRelatedJobsButton } from "saltbox-core/shared/components/jobs/open-related-jobs-button";
import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";
import type { TaskStore } from "saltbox-core/store";

import { TaskDetailItem } from "./task-detail-item";
import { TaskDetailsModal } from "./task-details-modal";
import { TaskRunControl } from "./task-run-control";
import styles from "./task-run-details.module.css";

type TaskRunDetailsProps = {
  taskStore: TaskStore;
};

export const TaskRunDetails = observer(function TaskRunDetails({ taskStore }: TaskRunDetailsProps) {
  const { t } = useTranslation();
  const taskId = taskStore.task?.id;

  return (
    <Flex className={styles.taskDetailsContainer} align="center" wrap gap="middle">
      <TaskRunControl
        isRunTaskLoading={taskStore.isRunTaskLoading}
        isStopTaskLoading={taskStore.isStopTaskLoading}
        isRestartFailedLoading={taskStore.isRestartFailedLoading}
        taskStatus={taskStore.task?.status?.type}
        failedCount={taskStore.task?.minions_count?.failed}
        pendingCount={taskStore.task?.minions_count?.pending}
        onRunTask={taskStore.handleRunTask}
        onStopTask={taskStore.handleStopTask}
        onRestartFailed={taskStore.handleRestartFailed}
      />
      <TaskDetailsModal taskStore={taskStore} />

      {!!taskId && (
        <OpenRelatedJobsButton
          sourceId={taskId}
          sourceType={taskStore.task?.task_type === "policy" ? "policy" : "task"}
        />
      )}

      {taskStore.task ? (
        <Flex align="center">
          <TaskDetailItem label={t("task.type")}>
            {taskStore.task.task_type === "classic"
              ? t("task.type-classic")
              : t("task.type-policy")}
          </TaskDetailItem>
          <Divider type="vertical" />
          <TaskDetailItem label={t("task.status")}>
            <TaskStatusIndicator status={taskStore.task?.status?.type ?? "none"} />
          </TaskDetailItem>
          <Divider type="vertical" />
          <TaskDetailItem label={t("task.created")}>
            {taskStore.task.created ? (
              formatTimeByUserTZ(taskStore.task.created)
            ) : (
              <Skeleton.Input size="small" />
            )}
          </TaskDetailItem>
          <Divider type="vertical" />
          <TaskDetailItem label={t("task.user")}>
            {taskStore.task.user?.name ?? <Skeleton.Input size="small" />}
          </TaskDetailItem>
        </Flex>
      ) : (
        <Skeleton.Input size="small" />
      )}
    </Flex>
  );
});
