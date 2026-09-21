import type { TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";
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

    const errorMessage =
      taskStore.taskJobReturnsError === "missing-context"
        ? t("task.minion.job-returns-missing-context")
        : null;

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
        loaders={[taskStore.taskJobReturnsStore.taskJobReturnsLoad]}
      >
        <MinionTaskResults
          selectedMinion={displayMinion}
          jobReturns={taskStore.taskJobReturns}
          isJobReturnsLoading={isLoading}
          onRestartFailedMinion={onRestartFailedMinion}
          onTtlApplied={taskStore.taskJobReturnsStore.applyJobReturnTtl}
        />
      </BaseMinionDrawer>
    );
  }
);
