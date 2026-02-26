import { type TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Divider, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";
import {
  MinionTaskRestartFailedButton,
  MinionTaskRestartFailedButtonProps,
} from "saltbox-core/widgets/task/minion-task-restart-failed-button";

interface MinionTaskResultsShortInfoProps {
  status: TaskMinionModel["status"];
  startLastDt: TaskMinionModel["start_last_dt"];
  finishedDt: TaskMinionModel["finished_dt"];
  minionId: TaskMinionModel["minion_id"];
  minionInnerId: TaskMinionModel["minion_inner_id"];
  onRestartFailedMinion: MinionTaskRestartFailedButtonProps["onRestartFailedMinion"];
}

export function MinionTaskResultsShortInfo({
  status,
  startLastDt,
  finishedDt,
  minionId,
  minionInnerId,
  onRestartFailedMinion,
}: MinionTaskResultsShortInfoProps) {
  const { t } = useTranslation();

  return (
    <>
      <Flex align="center" style={{ minHeight: 24 }}>
        <span>
          <strong>{t("task.minions.table-status")}:</strong> <MinionTaskStatus status={status} />
        </span>

        {status === TaskMinionStatus.Failed && (
          <MinionTaskRestartFailedButton
            minionId={minionId}
            minionInnerId={minionInnerId}
            onRestartFailedMinion={onRestartFailedMinion}
          />
        )}
      </Flex>

      <Flex align="center" gap="small">
        <span>
          <strong>{t("task.minions.table-started")}:</strong>{" "}
          <RelativeTime date={startLastDt} fallback={<>{t("task.minions.table-not-started")}</>} />
        </span>

        <Divider type="vertical" />

        <span>
          <strong>{t("task.minions.table-finished")}:</strong>{" "}
          <RelativeTime date={finishedDt} fallback={<>{t("task.minions.table-not-started")}</>} />
        </span>
      </Flex>
    </>
  );
}
