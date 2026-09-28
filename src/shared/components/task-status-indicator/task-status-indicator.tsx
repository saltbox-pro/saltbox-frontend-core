import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "@saltbox/saltbox-core-api-client";
import { Flex, Skeleton, Spin } from "antd";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface TaskStatusIndicatorProps {
  status?: TaskStatus | "none";
  reason?: string;
}

interface StatusConfig {
  icon: ReactNode;
  translationKey: string;
}

const spinningIcon = <Spin indicator={<LoadingOutlined spin />} size="small" />;

const TTL_STOP_REASON = "timeout";

const ttlStopStatusConfig: Partial<Record<TaskStatus, StatusConfig>> = {
  [TaskStatus.Stopping]: {
    icon: spinningIcon,
    translationKey: "task.stopping-by-ttl",
  },
  [TaskStatus.Stopped]: {
    icon: <FieldTimeOutlined />,
    translationKey: "task.stopped-by-ttl",
  },
};

export const TaskStatusIndicator = ({ status, reason }: TaskStatusIndicatorProps) => {
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

  const config =
    (reason === TTL_STOP_REASON && status !== "none" ? ttlStopStatusConfig[status] : undefined) ??
    statusConfig[status];

  if (!config) {
    return <Skeleton.Input size="small" />;
  }

  return (
    <Flex component="span" align="center" gap={6}>
      {config.icon} {t(config.translationKey)}
    </Flex>
  );
};
