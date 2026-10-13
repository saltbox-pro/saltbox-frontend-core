import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
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

export interface TaskStatusBadgeProps {
  status?: TaskStatus;
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

const TASK_STATUS_VIEW: Record<TaskStatus, StatusView> = {
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
};

const TTL_STOP_VIEW: Partial<Record<TaskStatus, Pick<StatusView, "icon" | "translationKey">>> = {
  [TaskStatus.Stopping]: {
    icon: spinningIcon,
    translationKey: "task.stopping-by-ttl",
  },
  [TaskStatus.Stopped]: {
    icon: <WarningOutlined />,
    translationKey: "task.stopped-by-ttl",
  },
};

export function TaskStatusBadge({ status, reason, size }: TaskStatusBadgeProps) {
  const { t } = useTranslation();

  if (!status) {
    return <Skeleton.Input size="small" />;
  }

  const view = TASK_STATUS_VIEW[status];

  if (!view) {
    return <Skeleton.Input size="small" />;
  }

  const ttlView = reason === TTL_STOP_REASON ? TTL_STOP_VIEW[status] : undefined;

  return (
    <StatusBadge tone={view.tone} size={size} icon={ttlView?.icon ?? view.icon}>
      {t(ttlView?.translationKey ?? view.translationKey)}
    </StatusBadge>
  );
}
