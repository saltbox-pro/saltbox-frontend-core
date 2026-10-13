import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { JobReturnStatus } from "@saltbox/saltbox-core-api-client";
import { STATUS_TONE_COLORS, StatusBadge, type StatusTone } from "@saltbox/saltbox-frontend-common";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type JobReturnStatusBadgeProps = {
  status?: JobReturnStatus | null;
  retcode?: number | null;
};

type JobReturnStatusView = {
  tone: StatusTone;
  icon: ReactNode;
  translationKey: string;
};

export const JOB_RETURN_STATUS_VIEW: Record<JobReturnStatus, JobReturnStatusView> = {
  [JobReturnStatus.Waiting]: {
    tone: "pending",
    icon: <ClockCircleOutlined />,
    translationKey: "task.job-returns-table.status-waiting",
  },
  [JobReturnStatus.Timeout]: {
    tone: "warning",
    icon: <WarningOutlined />,
    translationKey: "task.job-returns-table.status-timeout",
  },
  [JobReturnStatus.Ignored]: {
    tone: "pending",
    icon: <MinusCircleOutlined />,
    translationKey: "task.job-returns-table.status-ignored",
  },
  [JobReturnStatus.Success]: {
    tone: "success",
    icon: <CheckCircleOutlined />,
    translationKey: "task.job-returns-table.status-success",
  },
  [JobReturnStatus.Failed]: {
    tone: "danger",
    icon: <CloseCircleOutlined />,
    translationKey: "task.job-returns-table.status-failed",
  },
};

export const JOB_RETURN_STATUS_COUNT_ORDER = [
  JobReturnStatus.Success,
  JobReturnStatus.Failed,
  JobReturnStatus.Timeout,
  JobReturnStatus.Ignored,
  JobReturnStatus.Waiting,
] as const;

export const getJobReturnStatusColor = (status: JobReturnStatus): string =>
  STATUS_TONE_COLORS[JOB_RETURN_STATUS_VIEW[status].tone];

const resolveJobReturnStatusView = (
  status?: JobReturnStatus | null,
  retcode?: number | null
): JobReturnStatusView | undefined => {
  if (status && JOB_RETURN_STATUS_VIEW[status]) {
    return JOB_RETURN_STATUS_VIEW[status];
  }

  if (retcode === 0) {
    return JOB_RETURN_STATUS_VIEW[JobReturnStatus.Success];
  }

  if (retcode != null && retcode !== 0) {
    return JOB_RETURN_STATUS_VIEW[JobReturnStatus.Failed];
  }

  return undefined;
};

export function JobReturnStatusBadge({ status, retcode }: JobReturnStatusBadgeProps) {
  const { t } = useTranslation();
  const view = resolveJobReturnStatusView(status, retcode);

  return (
    <StatusBadge tone={view?.tone ?? "pending"} icon={view?.icon ?? <QuestionCircleOutlined />}>
      {view ? t(view.translationKey) : (status ?? t("task.job-returns-table.status-unknown"))}
    </StatusBadge>
  );
}
