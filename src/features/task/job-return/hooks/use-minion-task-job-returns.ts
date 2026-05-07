import type { TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import { useEffect, useMemo, useRef } from "react";

import type { TaskStore } from "saltbox-core/store";

export type UseMinionTaskJobReturnsArgs = {
  taskStore: TaskStore;
  isOpened: boolean;
  taskId: string | null | undefined;
  taskMinionMongoId: string | null | undefined;
  selectedMinion: TaskMinionListResponse | null;
};

export type UseMinionTaskJobReturnsResult = {
  isLoading: boolean;
  hasData: boolean;
  displayMinion: TaskMinionListResponse | null;
};

export function useMinionTaskJobReturns({
  taskStore,
  isOpened,
  taskId,
  taskMinionMongoId,
  selectedMinion,
}: UseMinionTaskJobReturnsArgs): UseMinionTaskJobReturnsResult {
  const {
    resetTaskJobReturns,
    setTaskJobReturnsLoadError,
    applyTaskJobReturnsDrawerMinionFromTableRow,
    loadTaskJobReturns,
  } = taskStore;

  const drawerKey = useMemo(
    () => (isOpened && taskId && taskMinionMongoId ? taskMinionMongoId : null),
    [isOpened, taskId, taskMinionMongoId]
  );

  const prevDrawerKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!drawerKey) {
      prevDrawerKeyRef.current = null;
      resetTaskJobReturns();
      return;
    }

    const prevKey = prevDrawerKeyRef.current;
    const switchedMinion = prevKey !== null && prevKey !== drawerKey;
    prevDrawerKeyRef.current = drawerKey;

    if (switchedMinion) {
      resetTaskJobReturns();
    }

    if (!taskId) {
      setTaskJobReturnsLoadError("missing-context");
      return;
    }

    if (selectedMinion?.id === drawerKey) {
      applyTaskJobReturnsDrawerMinionFromTableRow(selectedMinion, drawerKey);
    }

    const currentDrawerMinion = taskStore.taskJobReturnsDrawerMinion;
    if (!currentDrawerMinion?.id) {
      setTaskJobReturnsLoadError("missing-context");
      return;
    }

    loadTaskJobReturns(taskId, drawerKey);
  }, [
    applyTaskJobReturnsDrawerMinionFromTableRow,
    drawerKey,
    loadTaskJobReturns,
    resetTaskJobReturns,
    selectedMinion,
    setTaskJobReturnsLoadError,
    taskId,
    taskStore.taskJobReturnsDrawerMinion,
    taskStore.taskJobReturnsDrawerMinion?.id,
  ]);

  return {
    isLoading: taskStore.taskJobReturnsLoading,
    hasData: taskStore.taskJobReturnsHasData,
    displayMinion: taskStore.taskJobReturnsDrawerMinion,
  };
}
