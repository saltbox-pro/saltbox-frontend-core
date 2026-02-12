import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Flex, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

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
  const { task } = taskStore;

  return (
    <Flex className={styles.taskDetailsContainer} align="center" wrap gap={24}>
      <TaskRunControl taskStore={taskStore} />

      <TaskDetailsModal taskStore={taskStore} />

      <TaskDetailItem label={t("task.type")}>
        {task?.task_type === "classic" ? t("task.type-classic") : t("task.type-policy")}
      </TaskDetailItem>
      <TaskDetailItem label={t("task.status")}>
        <TaskStatusIndicator status={task?.status?.type ?? "none"} />
      </TaskDetailItem>
      <TaskDetailItem label={t("task.created")}>
        <RelativeTime date={task?.created} fallback={<Skeleton.Input size="small" />} />
      </TaskDetailItem>
      <TaskDetailItem label={t("task.user")}>
        {task?.user?.name ?? <Skeleton.Input size="small" />}
      </TaskDetailItem>
    </Flex>
  );
});
