import { TaskMinionStatus, TaskModel } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import styles from "./task-minion-status-filter.module.css";
import { TaskMinionsStatusFiltersButton } from "./task-minions-status-filters-button";

type TaskMinionsStatsProps = {
  counts: TaskModel["minions_count"] | undefined;
  selectedCategory: TaskMinionStatus | null;
  onSelectCategory: (category: TaskMinionStatus | null) => void;
};

export function TaskMinionStatusFilter({
  counts,
  selectedCategory,
  onSelectCategory,
}: TaskMinionsStatsProps) {
  const { t } = useTranslation();

  const {
    total = 0,
    pending = 0,
    busy = 0,
    in_work: inWork = busy,
    failed = 0,
    success = 0,
  } = counts ?? {};

  const statCards = useMemo(
    () => [
      {
        category: null,
        title: t("task.minions-nav.list-all"),
        value: total,
        color: "#262626",
      },
      {
        category: TaskMinionStatus.Success,
        title: t("task.minions-nav.list-success"),
        value: success,
        color: "#52C41A",
      },
      {
        category: TaskMinionStatus.Failed,
        title: t("task.minions-nav.list-failed"),
        value: failed,
        color: "#FF4D4F",
      },
      {
        category: TaskMinionStatus.InWork,
        title: t("task.minions-nav.list-in-work"),
        value: inWork,
        color: "#1677FF",
      },
      {
        category: TaskMinionStatus.Pending,
        title: t("task.minions-nav.list-pending"),
        value: pending,
        color: "#858585",
      },
    ],
    [total, failed, inWork, pending, success, t]
  );

  return (
    <Flex gap={5} justify="space-between" className={styles.taskStatusFilter}>
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
