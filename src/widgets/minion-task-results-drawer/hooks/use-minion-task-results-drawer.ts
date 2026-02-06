import { JobReturnModel, TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { useCallback, useMemo, useState } from "react";

import type { TaskStore } from "saltbox-core/store";

interface UseMinionTaskResultsDrawerReturn {
  selectedMinion: TaskMinionModel | null;
  selectedMinionJobReturns: Array<JobReturnModel>;
  openedId: string | null | undefined;
  isOpened: boolean;
  slug: string | null;
  open: (minion: TaskMinionModel) => void;
  close: () => void;
  clearData: () => void;
}

export function useMinionTaskResultsDrawer(taskStore: TaskStore): UseMinionTaskResultsDrawerReturn {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [openedMinionKey, setOpenedMinionKey] = useState<{
    master: string;
    minionId: string;
  } | null>(null);

  const openedId = openedMinionKey?.minionId ?? null;

  const selectedMinion = useMemo(() => {
    if (!openedMinionKey) return null;
    return (
      taskStore.minions?.find(
        (m) => m.master === openedMinionKey.master && m.minion_id === openedMinionKey.minionId
      ) ?? null
    );
  }, [openedMinionKey, taskStore.minions]);

  const selectedMinionJobReturns = useMemo(() => {
    if (!selectedMinion) return [];
    const minionJobIds = Object.keys(selectedMinion.jobs ?? {})
      .sort()
      .reverse();
    return minionJobIds
      .map((jobId) =>
        taskStore.jobReturns?.find(
          (jobReturn) =>
            jobReturn.jid === jobId &&
            jobReturn.salt_master === selectedMinion.master &&
            jobReturn.minion_id === selectedMinion.minion_id
        )
      )
      .filter((jobReturn) => jobReturn !== undefined);
  }, [selectedMinion, taskStore.jobReturns]);

  const open = useCallback(
    (minion: TaskMinionModel) => {
      setIsOpened(true);
      setSlug(taskStore.task?.target_collection?.slug ?? null);
      setOpenedMinionKey({ master: minion.master, minionId: minion.minion_id });
    },
    [taskStore.task?.target_collection?.slug]
  );

  const close = useCallback(() => {
    setIsOpened(false);
  }, []);

  const clearData = useCallback(() => {
    setOpenedMinionKey(null);
    setSlug(null);
  }, []);

  return {
    selectedMinion,
    selectedMinionJobReturns,
    isOpened,
    openedId,
    slug,
    open,
    close,
    clearData,
  };
}
