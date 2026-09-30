import { TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { StatusBadge } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import {
  getTaskMinionStatusLabelKey,
  getTaskMinionStatusTitleKey,
  getTaskMinionStatusTone,
  isKnownTaskMinionStatus,
} from "./helpers/task-minion-status-meta";

type MinionTaskStatusProps = {
  status: TaskMinionStatus | null | undefined;
};

export function MinionTaskStatus({ status }: MinionTaskStatusProps) {
  const { t } = useTranslation();

  if (status == null) {
    return null;
  }

  if (!isKnownTaskMinionStatus(status)) {
    return (
      <StatusBadge tone="warning">
        {`${t("task.minions.table-unknown-code")}: ${status}`}
      </StatusBadge>
    );
  }

  const titleKey = getTaskMinionStatusTitleKey(status);

  return (
    <StatusBadge tone={getTaskMinionStatusTone(status)} title={titleKey ? t(titleKey) : undefined}>
      {t(getTaskMinionStatusLabelKey(status))}
    </StatusBadge>
  );
}
