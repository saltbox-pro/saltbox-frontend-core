import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Descriptions, Spin } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  JobResult,
  TaskJobStatus,
  TaskMinionStatus,
  TaskModel,
  TaskStatus,
} from "saltbox-core-api";
import { formatTimeByUserTZ } from "saltbox-core/shared/utils/datetime";
import styles from "./task-stat.module.css";

interface TaskStatistics {
  pendingJobs: number;
  processedMinions: number;
  processedJobs: number;
  failedMinions: number;
  created: string;
}

function calcTaskStatistics(task: TaskModel | null): TaskStatistics {
  const stat: TaskStatistics = {
    failedMinions: 0,
    pendingJobs: 0,
    processedJobs: 0,
    processedMinions: 0,
    created: "",
  };

  if (!task) return stat;

  if (task?.created) {
    stat.created = formatTimeByUserTZ(task?.created);
  }

  stat.failedMinions = Object.keys(task?.minions ?? {}).reduce(
    (failedMinions, mid) => {
      const minion = task.minions![mid];
      if (minion?.status === TaskMinionStatus.Failed) {
        failedMinions++;
      }
      return failedMinions;
    },
    0,
  );

  stat.pendingJobs = Object.keys(task?.jobs ?? {}).reduce(
    (pendingJobs, jid) => {
      const job = task.jobs![jid];
      if (job?.status === TaskJobStatus.Pending) {
        pendingJobs++;
      }
      return pendingJobs;
    },
    0,
  );

  stat.processedJobs = Object.keys(task?.jobs ?? {}).reduce(
    (pendingJobs, jid) => {
      const job = task.jobs![jid];
      if (
        job?.status !== TaskJobStatus.Pending &&
        job?.status !== TaskJobStatus.Running
      ) {
        pendingJobs++;
      }
      return pendingJobs;
    },
    0,
  );

  return stat;
}

export const TaskStat = ({
  task,
  jobReturns,
}: {
  task: TaskModel | null;
  jobReturns: JobResult[];
}) => {
  const { t } = useTranslation();

  const taskStatus: { [key in TaskStatus | "none"]: ReactNode } = {
    [TaskStatus.Created]: (
      <span>
        <ClockCircleOutlined />
        {t("task.created")}
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

  const taskStatistics = calcTaskStatistics(task);

  return (
    <Descriptions
      bordered
      className={styles.taskStat}
      column={3}
      items={[
        {
          key: "status",
          label: t("task.status"),
          children: taskStatus?.[task?.status ?? "none"],
        },
        {
          key: "targets-queue",
          label: t("task.pending-jobs"),
          children: taskStatistics.pendingJobs,
        },
        {
          key: "processed-minions",
          label: t("task.proceessed-minions"),
          children: jobReturns?.length ?? 0,
        },
        {
          key: "created",
          label: t("task.created"),
          children: taskStatistics.created,
        },
        {
          key: "processed-jobs",
          label: t("task.processed-jobs"),
          children: taskStatistics.processedJobs,
        },
        {
          key: "failed-minions",
          label: t("task.failed-minions"),
          children: taskStatistics.failedMinions,
        },
      ]}
    />
  );
};
