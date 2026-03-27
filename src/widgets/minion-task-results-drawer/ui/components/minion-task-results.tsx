import type { JobReturnModel, TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";

import type { MinionTaskRestartFailedButtonProps } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

import { MinionTaskResultsJobResult } from "./minion-task-results-job-result";
import { MinionTaskResultsShortInfo } from "./minion-task-results-short-info";

export interface MinionTaskResultsProps {
  selectedMinion: TaskMinionModel | null;
  selectedMinionJobReturns: JobReturnModel[];
  onRestartFailedMinion: MinionTaskRestartFailedButtonProps["onRestartFailedMinion"];
}

export function MinionTaskResults({
  selectedMinion,
  selectedMinionJobReturns,
  onRestartFailedMinion,
}: MinionTaskResultsProps) {
  const {
    status,
    start_last_dt: startLastDt,
    finished_dt: finishedDt,
    minion_id: minionId,
    minion_inner_id: minionInnerId,
  } = selectedMinion ?? {};

  return (
    <Flex vertical gap="large">
      <MinionTaskResultsShortInfo
        status={status}
        startLastDt={startLastDt}
        finishedDt={finishedDt}
        minionId={minionId}
        minionInnerId={minionInnerId}
        onRestartFailedMinion={onRestartFailedMinion}
      />

      <MinionTaskResultsJobResult jobReturns={selectedMinionJobReturns} />
    </Flex>
  );
}
