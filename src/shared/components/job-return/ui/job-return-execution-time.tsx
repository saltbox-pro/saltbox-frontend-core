import { JobReturnStatus } from "@saltbox/saltbox-core-api-client";
import { formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

export interface JobReturnExecutionTimeProps {
  stamp?: string | null;
  status?: JobReturnStatus | null;
}

export function JobReturnExecutionTime({ stamp, status }: JobReturnExecutionTimeProps) {
  const { t } = useTranslation();

  if (status === JobReturnStatus.Timeout) {
    return (
      <Typography.Text type="secondary">
        {t("task.job-returns-table.status-timeout")}
      </Typography.Text>
    );
  }

  if (status === JobReturnStatus.Ignored) {
    return (
      <Typography.Text type="secondary">
        {t("task.job-returns-table.status-ignored")}
      </Typography.Text>
    );
  }

  if (stamp == null || stamp === "") {
    return (
      <Typography.Text type="secondary">
        {t("task.job-returns-table.execution-time-pending")}
      </Typography.Text>
    );
  }

  return formatTimeByUserTZ(stamp);
}
