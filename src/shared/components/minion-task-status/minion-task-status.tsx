import { TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { StatusBadge } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import {
  getTaskMinionStatusMeta,
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

  const meta = isKnownTaskMinionStatus(status) ? getTaskMinionStatusMeta(status) : undefined;

  if (!meta) {
    return (
      <StatusBadge tone="warning">
        {`${t("task.minions.table-unknown-code")}: ${status}`}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone={meta.tone} title={meta.titleKey ? t(meta.titleKey) : undefined}>
      {t(meta.labelKey)}
    </StatusBadge>
  );
}
