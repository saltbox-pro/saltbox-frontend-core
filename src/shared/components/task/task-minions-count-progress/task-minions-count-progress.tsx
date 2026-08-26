import { TaskMinionStatus, type TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { Flex, Popover, Progress } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getTaskMinionStatusColor,
  getTaskMinionStatusLabelKey,
  includesPolicyClientStatuses,
  readTaskMinionsCount,
  TASK_MINION_COUNT_POPOVER_ROWS,
} from "saltbox-core/shared/components/minion-task-status/helpers/task-minion-status-meta";

import styles from "./task-minions-count-progress.module.css";

type TaskMinionsCountProgressProps = {
  counts: TaskModel["minions_count"] | null | undefined;
  taskType?: TaskType | null;
};

export function TaskMinionsCountProgress({ counts, taskType }: TaskMinionsCountProgressProps) {
  const { t } = useTranslation();
  const countsView = readTaskMinionsCount(counts);
  const { total: totalMinions, success: statusSuccess, failed: statusFailed } = countsView;
  const showPolicyStatuses = includesPolicyClientStatuses(taskType);

  const progressStrokeColors = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      if (totalMinions <= 0) {
        return "#bfbfbf";
      }
      if (i < Math.ceil((statusSuccess / totalMinions) * 10)) {
        return getTaskMinionStatusColor(TaskMinionStatus.Success);
      }
      if (i < Math.ceil(((statusSuccess + statusFailed) / totalMinions) * 10)) {
        return getTaskMinionStatusColor(TaskMinionStatus.Failed);
      }
      return "#bfbfbf";
    });
  }, [statusFailed, statusSuccess, totalMinions]);

  const popoverRows = TASK_MINION_COUNT_POPOVER_ROWS.filter(
    (row) => (!row.policyOnly || showPolicyStatuses) && countsView[row.countKey] > 0
  );

  const popoverContent = (
    <Flex vertical gap={4} className={styles.popover}>
      <strong>{t("minions.tasks-table-status-header")}</strong>
      {popoverRows.map((row) => (
        <Flex key={row.status} justify="space-between" align="center" gap={16}>
          <Flex align="center" gap={8}>
            <span
              className={styles.statusDot}
              style={{ backgroundColor: getTaskMinionStatusColor(row.status) }}
            />
            <span>{t(getTaskMinionStatusLabelKey(row.status))}</span>
          </Flex>
          <span>{countsView[row.countKey]}</span>
        </Flex>
      ))}
      <Flex justify="space-between" gap={16}>
        <span>{t("minions.tasks-table-total-minions")}</span>
        <span style={{ fontWeight: "bold" }}>{totalMinions}</span>
      </Flex>
    </Flex>
  );

  const finishedShare =
    totalMinions > 0 ? ((statusSuccess + statusFailed) / totalMinions) * 100 : 0;
  const successShare = totalMinions > 0 ? (statusSuccess / totalMinions) * 100 : 0;

  return (
    <Popover content={popoverContent}>
      <Progress
        steps={10}
        size={8.5}
        percent={finishedShare}
        success={{ percent: successShare }}
        strokeColor={progressStrokeColors}
        showInfo={false}
      />
    </Popover>
  );
}
