import type { TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import {
  createNotFoundError,
  createResourceLoadError,
  type ResourceLoadError,
} from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import { TaskStore } from "saltbox-core/store";
import { type MinionTaskRestartFailedButtonProps } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

import { useMinionTaskJobReturns } from "../hooks/use-minion-task-job-returns";
import type { TaskJobReturnsErrorKey } from "../model/task-job-returns-store";

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

const mapTaskJobReturnsError = (
  errorKey: TaskJobReturnsErrorKey,
  t: (key: string) => string
): ResourceLoadError | null => {
  switch (errorKey) {
    case "missing-context":
      return createResourceLoadError(null, {
        fallbackStatus: 400,
        fallbackMessage: t("task.minion.job-returns-missing-context"),
      });
    case "not-found":
      return createNotFoundError(t("task.minion.job-returns-not-found"));
    case "access-denied":
      return createResourceLoadError(null, {
        fallbackStatus: 403,
        fallbackMessage: t("errors.access-denied"),
      });
    case "load-failed":
      return createResourceLoadError(null, {
        fallbackStatus: 500,
        fallbackMessage: t("task.minion.job-returns-load-error"),
      });
    default:
      return null;
  }
};

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

    const loadError = useMemo(
      () => mapTaskJobReturnsError(taskStore.taskJobReturnsError, t),
      [taskStore.taskJobReturnsError, t]
    );

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
        loadError={loadError}
        onRetry={() => {
          if (taskId && taskMinionMongoId) {
            taskStore.loadTaskJobReturns(taskId, taskMinionMongoId).catch(() => undefined);
          }
        }}
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
