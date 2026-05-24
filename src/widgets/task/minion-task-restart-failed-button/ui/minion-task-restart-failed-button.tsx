import { IssuesCloseOutlined } from "@ant-design/icons";
import type { TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

import { useRestartFailedMinionHandler } from "../hooks/useRestartFailedMinionHandler";

export interface MinionTaskRestartFailedButtonProps {
  minionId: TaskMinionListResponse["minion_id"];
  minionInnerId: TaskMinionListResponse["minion_inner_id"];
  onRestartFailedMinion?: (minionInnerId: string) => Promise<void>;
}

export function MinionTaskRestartFailedButton({
  minionId,
  minionInnerId,
  onRestartFailedMinion,
}: MinionTaskRestartFailedButtonProps) {
  const { t } = useTranslation();

  const handleRestartFailedMinionClick = useRestartFailedMinionHandler(onRestartFailedMinion, t);

  if (!onRestartFailedMinion || !minionInnerId) {
    return null;
  }

  return (
    <Button
      size="small"
      color="orange"
      variant="solid"
      icon={<IssuesCloseOutlined />}
      title={t("task.restart-failed-minion")}
      onClick={() => handleRestartFailedMinionClick(minionInnerId, minionId)}
    />
  );
}
