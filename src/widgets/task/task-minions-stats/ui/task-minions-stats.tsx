import { Statistic, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { MinionCategory } from "../model/minion-category";

import styles from "./task-minions-stats.module.css";

type TaskMinionsStatsProps = {
  counts: {
    all: number;
    pending: number;
    inWork: number;
    failed: number;
    success: number;
  };
  selectedCategory: MinionCategory;
  onSelectCategory: (category: MinionCategory) => void;
};

export function TaskMinionsStats({
  counts,
  selectedCategory,
  onSelectCategory,
}: TaskMinionsStatsProps) {
  const { t } = useTranslation();

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
}
