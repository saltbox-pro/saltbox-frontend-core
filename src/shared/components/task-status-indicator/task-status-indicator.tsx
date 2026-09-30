import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "@saltbox/saltbox-core-api-client";
import {
  StatusBadge,
  type StatusBadgeSize,
  type StatusTone,
} from "@saltbox/saltbox-frontend-common";
import { Skeleton, Spin } from "antd";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface TaskStatusIndicatorProps {
  status?: TaskStatus | "none";
  reason?: string;
  size?: StatusBadgeSize;
}

type StatusView = {
  tone: StatusTone;
  icon: ReactNode;
  translationKey: string;
};

const spinningIcon = <Spin indicator={<LoadingOutlined spin />} size="small" />;

const TTL_STOP_REASON = "timeout";

const TASK_STATUS_VIEW: Record<TaskStatus | "none", StatusView> = {
  [TaskStatus.Created]: {
    tone: "pending",
    icon: <ClockCircleOutlined />,
    translationKey: "task.created",
  },
  [TaskStatus.Finished]: {
    tone: "success",
    icon: <CheckCircleOutlined />,
    translationKey: "task.finished",
  },
  [TaskStatus.Running]: {
    tone: "active",
    icon: spinningIcon,
    translationKey: "task.running",
  },
  [TaskStatus.Stopping]: {
    tone: "active",
    icon: spinningIcon,
    translationKey: "task.stopping",
  },
  [TaskStatus.Stopped]: {
    tone: "warning",
    icon: <StopOutlined />,
    translationKey: "task.stopped",
  },
  [TaskStatus.WaitMinions]: {
    tone: "active",
    icon: spinningIcon,
    translationKey: "task.wait-minions",
  },
  none: {
    tone: "pending",
    icon: <QuestionCircleOutlined />,
    translationKey: "task.unknown",
  },
};

const TTL_STOP_STATUS_VIEW: Partial<Record<TaskStatus, StatusView>> = {
  [TaskStatus.Stopping]: {
    tone: "active",
    icon: spinningIcon,
    translationKey: "task.stopping-by-ttl",
  },
  [TaskStatus.Stopped]: {
    tone: "warning",
    icon: <WarningOutlined />,
    translationKey: "task.stopped-by-ttl",
  },
};

export const TaskStatusIndicator = ({ status, reason, size }: TaskStatusIndicatorProps) => {
  const { t } = useTranslation();

  if (!status) {
    return <Skeleton.Input size="small" />;
  }

  const view =
    (reason === TTL_STOP_REASON && status !== "none" ? TTL_STOP_STATUS_VIEW[status] : undefined) ??
    TASK_STATUS_VIEW[status];

  if (!view) {
    return <Skeleton.Input size="small" />;
  }

  return (
    <StatusBadge tone={view.tone} size={size} icon={view.icon}>
      {t(view.translationKey)}
    </StatusBadge>
  );
};
