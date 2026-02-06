import type { JobReturnModel, TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { Flex, Tabs } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MinionTaskResultsJobResult } from "./minion-task-results-job-result";
import { MinionTaskResultsShortInfo } from "./minion-task-results-short-info";

export interface MinionTaskResultsProps {
  selectedMinion: TaskMinionModel | null;
  selectedMinionJobReturns: JobReturnModel[];
}

export function MinionTaskResults({
  selectedMinion,
  selectedMinionJobReturns,
}: MinionTaskResultsProps) {
  const { t } = useTranslation();

  const { status, start_last_dt: startLastDt, finished_dt: finishedDt } = selectedMinion ?? {};

  const tabs = useMemo(
    () => [
      {
        key: "results",
        label: t("task.minion.results"),
        children: (
          <Flex vertical gap={20}>
            <MinionTaskResultsShortInfo
              status={status}
              startLastDt={startLastDt}
              finishedDt={finishedDt}
            />

            <MinionTaskResultsJobResult jobReturns={selectedMinionJobReturns} />
          </Flex>
        ),
      },
    ],
    [t, status, startLastDt, finishedDt, selectedMinionJobReturns]
  );

  return <Tabs items={tabs} />;
}
