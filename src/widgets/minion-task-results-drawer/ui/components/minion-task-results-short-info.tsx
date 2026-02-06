import type { TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useTranslation } from "react-i18next";

import { MinionTaskStatus } from "saltbox-core/shared/components/minion-task-status/minion-task-status";

interface MinionTaskResultsShortInfoProps {
  status: TaskMinionModel["status"];
  startLastDt: TaskMinionModel["start_last_dt"];
  finishedDt: TaskMinionModel["finished_dt"];
}

export function MinionTaskResultsShortInfo({
  status,
  startLastDt,
  finishedDt,
}: MinionTaskResultsShortInfoProps) {
  const { t } = useTranslation();

  return (
    <>
      <Flex gap={8}>
        <span>
          <strong>{t("task.minion.job-status")}:</strong> <MinionTaskStatus status={status} />
        </span>
      </Flex>
      <Flex gap={8}>
        <span>
          <strong>{t("task.minion.finished")}:</strong>{" "}
          <RelativeTime date={finishedDt} fallback={<>-</>} />
        </span>
        <span>
          <strong>{t("task.minion.last-run")}:</strong>{" "}
          <RelativeTime date={startLastDt} fallback={<>never</>} />
        </span>
      </Flex>
    </>
  );
}
