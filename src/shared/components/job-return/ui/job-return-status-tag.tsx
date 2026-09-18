import { JobReturnStatus } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export interface JobReturnStatusTagProps {
  status?: JobReturnStatus | null;
  retcode?: number | null;
}

export function JobReturnStatusTag({ status, retcode }: JobReturnStatusTagProps) {
  const { t } = useTranslation();

  if (!status && retcode === undefined) {
    return <Tag>{t("task.job-returns-table.status-unknown")}</Tag>;
  }

  if (status === JobReturnStatus.Waiting) {
    return <Tag color="blue">{t("task.job-returns-table.status-waiting")}</Tag>;
  }

  if (status === JobReturnStatus.Timeout) {
    return <Tag color="orange">{t("task.job-returns-table.status-timeout")}</Tag>;
  }

  if (status === JobReturnStatus.Ignored) {
    return <Tag>{t("task.job-returns-table.status-ignored")}</Tag>;
  }

  if (status === JobReturnStatus.Success || retcode === 0) {
    return <Tag color="green">{t("task.job-returns-table.status-success")}</Tag>;
  }

  if (status === JobReturnStatus.Failed || (retcode !== undefined && retcode !== 0)) {
    return <Tag color="red">{t("task.job-returns-table.status-failed")}</Tag>;
  }

  return <Tag>{status}</Tag>;
}
