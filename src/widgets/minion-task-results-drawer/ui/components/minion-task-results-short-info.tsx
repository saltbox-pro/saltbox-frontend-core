import { type TaskMinionModel, TaskMinionStatus } from "@saltbox/saltbox-core-api-client";
import {
  InfoDescriptions,
  InfoDescriptionsProps,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";
import {
  MinionTaskRestartFailedButton,
  type MinionTaskRestartFailedButtonProps,
} from "saltbox-core/widgets/task/minion-task-restart-failed-button";

import styles from "./minion-task-results-short-info.module.css";

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

  const items = useMemo<InfoDescriptionsProps["items"]>(
    () => [
      {
        label: t("task.minions.table-status"),
        children: (
          <Flex className={styles.status} align="center">
            <MinionTaskStatus status={status} />

            {status === TaskMinionStatus.Failed && (
              <MinionTaskRestartFailedButton
                minionId={minionId}
                minionInnerId={minionInnerId}
                onRestartFailedMinion={onRestartFailedMinion}
              />
            )}
          </Flex>
        ),
      },
      {
        label: t("task.minions.table-started"),
        children: startLastDt ? (
          formatTimeByUserTZ(startLastDt)
        ) : (
          <>{t("task.minions.table-not-started")}</>
        ),
      },
      {
        label: t("task.minions.table-finished"),
        children: finishedDt ? (
          formatTimeByUserTZ(finishedDt)
        ) : (
          <>{t("task.minions.table-not-started")}</>
        ),
      },
    ],
    [finishedDt, minionId, minionInnerId, onRestartFailedMinion, startLastDt, status, t]
  );

  return <InfoDescriptions title={t("task.minion.results")} items={items} />;
}
