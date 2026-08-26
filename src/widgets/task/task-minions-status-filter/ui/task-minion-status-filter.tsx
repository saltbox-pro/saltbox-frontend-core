import { TaskMinionStatus, TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getTaskMinionStatusColor,
  getTaskMinionStatusLabelKey,
  includesPolicyClientStatuses,
  readTaskMinionsCount,
} from "saltbox-core/shared/components/minion-task-status/helpers/task-minion-status-meta";

import styles from "./task-minion-status-filter.module.css";
import { TaskMinionsStatusFiltersButton } from "./task-minions-status-filters-button";

type TaskMinionsStatsProps = {
  counts: TaskModel["minions_count"] | undefined;
  taskType?: TaskType | null;
  selectedCategory: TaskMinionStatus | null;
  onSelectCategory: (category: TaskMinionStatus | null) => void;
};

export function TaskMinionStatusFilter({
  counts,
  taskType,
  selectedCategory,
  onSelectCategory,
}: TaskMinionsStatsProps) {
  const { t } = useTranslation();
  const showPolicyStatuses = includesPolicyClientStatuses(taskType);
  const { total, pending, busy, blocked, unreachable, inWork, failed, success } =
    readTaskMinionsCount(counts);

  const statCards = useMemo(
    () => [
      {
        category: null as TaskMinionStatus | null,
        title: t("task.minions-nav.list-all"),
        value: total,
        color: "#262626",
      },
      {
        category: TaskMinionStatus.Success,
        title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Success)),
        value: success,
        color: getTaskMinionStatusColor(TaskMinionStatus.Success),
      },
      {
        category: TaskMinionStatus.Failed,
        title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Failed)),
        value: failed,
        color: getTaskMinionStatusColor(TaskMinionStatus.Failed),
      },
      {
        category: TaskMinionStatus.InWork,
        title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.InWork)),
        value: inWork,
        color: getTaskMinionStatusColor(TaskMinionStatus.InWork),
      },
      {
        category: TaskMinionStatus.Busy,
        title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Busy)),
        value: busy,
        color: getTaskMinionStatusColor(TaskMinionStatus.Busy),
      },
      ...(showPolicyStatuses
        ? [
            {
              category: TaskMinionStatus.Blocked,
              title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Blocked)),
              value: blocked,
              color: getTaskMinionStatusColor(TaskMinionStatus.Blocked),
            },
            {
              category: TaskMinionStatus.Unreachable,
              title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Unreachable)),
              value: unreachable,
              color: getTaskMinionStatusColor(TaskMinionStatus.Unreachable),
            },
          ]
        : []),
      {
        category: TaskMinionStatus.Pending,
        title: t(getTaskMinionStatusLabelKey(TaskMinionStatus.Pending)),
        value: pending,
        color: getTaskMinionStatusColor(TaskMinionStatus.Pending),
      },
    ],
    [blocked, busy, failed, inWork, pending, showPolicyStatuses, success, total, unreachable, t]
  );

  return (
    <Flex className={styles.taskStatusFilter} wrap="wrap" gap={5}>
      {statCards.map((card) => (
        <TaskMinionsStatusFiltersButton
          {...card}
          key={card.category}
          total={total}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      ))}
    </Flex>
  );
}
