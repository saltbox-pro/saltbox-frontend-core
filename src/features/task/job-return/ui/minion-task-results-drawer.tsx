import type { TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import { TaskStore } from "saltbox-core/store";
import { type MinionTaskRestartFailedButtonProps } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

import { useMinionTaskJobReturns } from "../hooks/use-minion-task-job-returns";

import { MinionTaskResults } from "./components/minion-task-results";

interface MinionTaskResultsDrawerProps {
  taskStore: TaskStore;
  taskId: string | null | undefined;
  selectedMinion: TaskMinionListResponse | null;
  isOpened: boolean;
  openedId: string | null | undefined;
  slug: string | null | undefined;
  onClose: () => void;
  onRestartFailedMinion: MinionTaskRestartFailedButtonProps["onRestartFailedMinion"];
}

export const MinionTaskResultsDrawer = observer<MinionTaskResultsDrawerProps>(
  function MinionTaskResultsDrawer({
    taskStore,
    taskId,
    selectedMinion,
    isOpened,
    openedId,
    slug,
    onClose,
    onRestartFailedMinion,
  }) {
    const { t } = useTranslation();
    const taskMinionMongoId = selectedMinion?.id ?? openedId ?? null;

    const { isLoading, hasData, displayMinion } = useMinionTaskJobReturns({
      taskStore,
      isOpened,
      taskId,
      taskMinionMongoId,
      selectedMinion,
    });

    const { minion_id: minionId = openedId, minion_inner_id: minionInnerId } = displayMinion ?? {};

    const errorMessage = useMemo(() => {
      switch (taskStore.taskJobReturnsError) {
        case "missing-context":
          return t("task.minion.job-returns-missing-context");
        case "not-found":
          return t("task.minion.job-returns-not-found");
        case "access-denied":
          return t("errors.access-denied");
        case "load-failed":
          return t("task.minion.job-returns-load-error");
        default:
          return null;
      }
    }, [taskStore.taskJobReturnsError, t]);

    const transitionKey =
      isOpened && taskMinionMongoId
        ? `${taskId ?? ""}-${taskMinionMongoId}`
        : isOpened
          ? "opened"
          : "closed";

    return (
      <BaseMinionDrawer
        id={minionId}
        innerId={minionInnerId}
        slug={slug}
        open={isOpened}
        onClose={onClose}
        loading={isLoading && !hasData}
        hasData={hasData}
        errorMessage={errorMessage}
        transitionKey={transitionKey}
      >
        <MinionTaskResults
          selectedMinion={displayMinion}
          jobReturns={taskStore.taskJobReturns}
          isJobReturnsLoading={isLoading}
          onRestartFailedMinion={onRestartFailedMinion}
        />
      </BaseMinionDrawer>
    );
  }
);
