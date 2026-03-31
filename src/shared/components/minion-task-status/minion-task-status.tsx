import { TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export interface MinionTaskStatusProps {
  status: TaskMinionStatus | null | undefined;
}

export function MinionTaskStatus({ status }: MinionTaskStatusProps) {
  const { t } = useTranslation();

  switch (status) {
    case TaskMinionStatus.InWork:
      return <Tag color="blue">{t("task.minions.table-in-work")}</Tag>;
    case TaskMinionStatus.Failed:
      return <Tag color="red">{t("task.minions.table-failed")}</Tag>;
    case TaskMinionStatus.Success:
      return <Tag color="green">{t("task.minions.table-success")}</Tag>;
    case TaskMinionStatus.Pending:
      return <Tag color="default">{t("task.minions.table-pending")}</Tag>;
    default:
      return <Tag color="orange">{`${t("task.minions.table-unknown-code")}: ${status}`}</Tag>;
  }
}
