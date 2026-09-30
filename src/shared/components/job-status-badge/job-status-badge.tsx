import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { JobStatus } from "@saltbox/saltbox-core-api-client";
import {
  StatusBadge,
  type StatusBadgeSize,
  type StatusTone,
} from "@saltbox/saltbox-frontend-common";
import { Skeleton, Spin } from "antd";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type JobStatusBadgeProps = {
  status?: JobStatus | null;
  size?: StatusBadgeSize;
  className?: string;
};

type JobStatusView = {
  tone: StatusTone;
  icon: ReactNode;
  translationKey: string;
};

const spinningIcon = <Spin indicator={<LoadingOutlined spin />} size="small" />;

const JOB_STATUS_VIEW: Record<JobStatus, JobStatusView> = {
  [JobStatus.Starting]: {
    tone: "pending",
    icon: <ClockCircleOutlined />,
    translationKey: "jobs.table-status-starting",
  },
  [JobStatus.Running]: {
    tone: "active",
    icon: spinningIcon,
    translationKey: "jobs.table-status-running",
  },
  [JobStatus.Finished]: {
    tone: "success",
    icon: <CheckCircleOutlined />,
    translationKey: "jobs.table-status-finished",
  },
  [JobStatus.LaunchError]: {
    tone: "danger",
    icon: <CloseCircleOutlined />,
    translationKey: "jobs.table-status-launch-error",
  },
};

export function JobStatusBadge({ status, size, className }: JobStatusBadgeProps) {
  const { t } = useTranslation();

  if (!status) {
    return <Skeleton.Input size="small" />;
  }

  const view = JOB_STATUS_VIEW[status];

  if (!view) {
    return (
      <StatusBadge
        className={className}
        tone="pending"
        size={size}
        icon={<QuestionCircleOutlined />}
      >
        {`${t("jobs.table-status-unknown")}: ${status}`}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge className={className} tone={view.tone} size={size} icon={view.icon}>
      {t(view.translationKey)}
    </StatusBadge>
  );
}
