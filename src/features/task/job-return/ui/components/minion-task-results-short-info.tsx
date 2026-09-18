import {
  type JobReturnModel,
  type TaskMinionListResponse,
  TaskMinionStatus,
} from "@saltbox/saltbox-core-api-client";
import {
  InfoDescriptions,
  type InfoDescriptionsProps,
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
import { MinionTaskResultsTtl, type MinionTaskResultsTtlProps } from "./minion-task-results-ttl";

interface MinionTaskResultsShortInfoProps {
  status: TaskMinionListResponse["status"];
  startLastDt: TaskMinionListResponse["start_last_dt"];
  finishedDt: TaskMinionListResponse["finished_dt"];
  minionId: TaskMinionListResponse["minion_id"];
  minionInnerId: TaskMinionListResponse["minion_inner_id"];
  latestJobReturn: JobReturnModel | null;
  onRestartFailedMinion: MinionTaskRestartFailedButtonProps["onRestartFailedMinion"];
  onTtlApplied: MinionTaskResultsTtlProps["onTtlApplied"];
}

export function MinionTaskResultsShortInfo({
  status,
  startLastDt,
  finishedDt,
  minionId,
  minionInnerId,
  latestJobReturn,
  onRestartFailedMinion,
  onTtlApplied,
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
      ...(latestJobReturn
        ? [
            {
              label: t("jobs.ttl-label"),
              children: (
                <MinionTaskResultsTtl jobReturn={latestJobReturn} onTtlApplied={onTtlApplied} />
              ),
            },
          ]
        : []),
    ],
    [
      finishedDt,
      latestJobReturn,
      minionId,
      minionInnerId,
      onRestartFailedMinion,
      onTtlApplied,
      startLastDt,
      status,
      t,
    ]
  );

  return <InfoDescriptions title={t("task.minion.results")} items={items} />;
}
