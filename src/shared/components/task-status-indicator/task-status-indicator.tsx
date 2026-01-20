import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "@saltbox/saltbox-core-api-client";
import { Skeleton, Spin } from "antd";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface TaskStatusIndicatorProps {
  status?: TaskStatus | "none";
}

interface StatusConfig {
  icon: ReactNode;
  translationKey: string;
}

const spinningIcon = <Spin indicator={<SyncOutlined spin />} size="small" />;

export const TaskStatusIndicator = ({ status }: TaskStatusIndicatorProps) => {
  const { t } = useTranslation();

  if (!status) {
    return <Skeleton.Input size="small" />;
  }

  const statusConfig: Record<TaskStatus | "none", StatusConfig> = {
    [TaskStatus.Created]: {
      icon: <ClockCircleOutlined />,
      translationKey: "task.created",
    },
    [TaskStatus.Finished]: {
      icon: <CheckCircleOutlined />,
      translationKey: "task.finished",
    },
    [TaskStatus.Running]: {
      icon: spinningIcon,
      translationKey: "task.running",
    },
    [TaskStatus.Stopping]: {
      icon: spinningIcon,
      translationKey: "task.stopping",
    },
    [TaskStatus.Stopped]: {
      icon: <StopOutlined />,
      translationKey: "task.stopped",
    },
    [TaskStatus.WaitMinions]: {
      icon: spinningIcon,
      translationKey: "task.wait-minions",
    },
    none: {
      icon: <QuestionCircleOutlined />,
      translationKey: "task.unknown",
    },
  };

  const config = statusConfig[status];

  if (!config) {
    return <Skeleton.Input size="small" />;
  }

  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
      {config.icon} {t(config.translationKey)}
    </span>
  );
};
