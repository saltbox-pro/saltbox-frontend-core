import { Flex, Statistic } from "antd";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";

import type { TaskStore } from "saltbox-core/store";

import { MinionCategory } from "../model/minion-category";

import styles from "./task-minions-stats.module.css";

type TaskMinionsStatsProps = {
  taskStore: TaskStore;
  selectedCategory: MinionCategory;
  onSelectCategory: (category: MinionCategory) => void;
};

export const TaskMinionsStats = observer(function TaskMinionsStats({
  taskStore,
  selectedCategory,
  onSelectCategory,
}: TaskMinionsStatsProps) {
  const { t } = useTranslation();

  const mc = taskStore.task?.minions_count;
  const counts = {
    all: mc?.total ?? 0,
    pending: mc?.pending ?? 0,
    inWork: (mc?.in_work ?? 0) + (mc?.busy ?? 0),
    failed: mc?.failed ?? 0,
    success: mc?.success ?? 0,
  };

  const getStatItemClass = (category: MinionCategory) => {
    const isActiveClass = selectedCategory === category ? " " + styles.taskStatItemActive : "";
    return styles.taskStatItem + isActiveClass;
  };

  return (
    <Flex gap={5} align="justify" className={styles.taskStatContainer}>
      <div
        className={getStatItemClass(MinionCategory.All)}
        onClick={() => onSelectCategory(MinionCategory.All)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectCategory(MinionCategory.All);
          }
        }}
      >
        <Statistic
          title={t("task.minions-nav.list-all")}
          value={counts.all}
          valueStyle={{ color: "#3f8600" }}
        />
      </div>
      <div
        className={getStatItemClass(MinionCategory.Pending)}
        onClick={() => onSelectCategory(MinionCategory.Pending)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectCategory(MinionCategory.Pending);
          }
        }}
      >
        <Statistic
          title={t("task.minions-nav.list-pending")}
          value={counts.pending}
          valueStyle={{ color: "#faad14" }}
        />
      </div>
      <div
        className={getStatItemClass(MinionCategory.InWork)}
        onClick={() => onSelectCategory(MinionCategory.InWork)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectCategory(MinionCategory.InWork);
          }
        }}
      >
        <Statistic
          title={t("task.minions-nav.list-in-work")}
          value={counts.inWork}
          valueStyle={{ color: "#1964db" }}
        />
      </div>
      <div
        className={getStatItemClass(MinionCategory.Failed)}
        onClick={() => onSelectCategory(MinionCategory.Failed)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectCategory(MinionCategory.Failed);
          }
        }}
      >
        <Statistic
          title={t("task.minions-nav.list-failed")}
          value={counts.failed}
          valueStyle={{ color: "#ff4d4f" }}
        />
      </div>
      <div
        className={getStatItemClass(MinionCategory.Success)}
        onClick={() => onSelectCategory(MinionCategory.Success)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectCategory(MinionCategory.Success);
          }
        }}
      >
        <Statistic
          title={t("task.minions-nav.list-success")}
          value={counts.success}
          valueStyle={{ color: "#3f8600" }}
        />
      </div>
    </Flex>
  );
});
