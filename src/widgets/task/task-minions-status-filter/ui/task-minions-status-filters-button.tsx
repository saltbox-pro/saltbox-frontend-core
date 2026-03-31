import { TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { Statistic } from "antd";

import styles from "./task-minions-status-filter-button.module.css";

export type TaskMinionsStatsCardProps = {
  category: TaskMinionStatus | null;
  title: string;
  value: number;
  total: number;
  color: string;
  selectedCategory: TaskMinionStatus | null;
  onSelectCategory: (category: TaskMinionStatus | null) => void;
};

export const TaskMinionsStatusFiltersButton = ({
  category,
  title,
  value,
  total,
  color,
  selectedCategory,
  onSelectCategory,
}: TaskMinionsStatsCardProps) => {
  const percent = total > 0 ? (!category ? 100 : Math.round((value / total) * 100)) : 0;

  return (
    <div
      className={`${styles.filterButton} ${selectedCategory === category ? styles.filterButtonActive : ""}`}
      onClick={() => onSelectCategory(category)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectCategory(category);
        }
      }}
    >
      <Statistic
        title={title}
        value={value}
        valueStyle={{ color }}
        suffix={
          !!category && (
            <span className={styles.valuePercent} style={{ color }}>
              {`(${percent}%)`}
            </span>
          )
        }
      />
    </div>
  );
};
