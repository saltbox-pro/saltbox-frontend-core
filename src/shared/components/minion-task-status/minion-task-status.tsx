import { TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import {
  getTaskMinionStatusLabelKey,
  getTaskMinionStatusTagColor,
  getTaskMinionStatusTitleKey,
  isKnownTaskMinionStatus,
} from "./helpers/task-minion-status-meta";

export interface MinionTaskStatusProps {
  status: TaskMinionStatus | null | undefined;
}

export function MinionTaskStatus({ status }: MinionTaskStatusProps) {
  const { t } = useTranslation();

  if (status == null) {
    return null;
  }

  if (!isKnownTaskMinionStatus(status)) {
    return <Tag color="orange">{`${t("task.minions.table-unknown-code")}: ${status}`}</Tag>;
  }

  const titleKey = getTaskMinionStatusTitleKey(status);

  return (
    <Tag color={getTaskMinionStatusTagColor(status)} title={titleKey ? t(titleKey) : undefined}>
      {t(getTaskMinionStatusLabelKey(status))}
    </Tag>
  );
}
