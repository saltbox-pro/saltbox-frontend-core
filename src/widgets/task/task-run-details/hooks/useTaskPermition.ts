import { TaskStatus } from "@saltbox/saltbox-core-api-client";
import { useMemo } from "react";

export type TaskRunControlInput = {
  taskStatus: TaskStatus | undefined;
  failedCount: number | undefined;
  pendingCount: number | undefined;
};

export const useTaskPermissions = ({
  taskStatus,
  failedCount,
  pendingCount,
}: TaskRunControlInput) => {
  const loadingOrNoStatus = taskStatus === undefined;

  const canRun = useMemo(
    () =>
      !loadingOrNoStatus &&
      taskStatus !== TaskStatus.Finished &&
      taskStatus !== TaskStatus.WaitMinions &&
      taskStatus !== TaskStatus.Running &&
      taskStatus !== TaskStatus.Stopping,
    [loadingOrNoStatus, taskStatus]
  );

  const canStop = useMemo(
    () =>
      !loadingOrNoStatus &&
      taskStatus !== TaskStatus.Created &&
      taskStatus !== TaskStatus.Finished &&
      taskStatus !== TaskStatus.Stopping &&
      taskStatus !== TaskStatus.Stopped,
    [loadingOrNoStatus, taskStatus]
  );

  const canRestartFailed = useMemo(
    () =>
      (!loadingOrNoStatus &&
        taskStatus !== TaskStatus.Stopping &&
        taskStatus !== TaskStatus.Created &&
        failedCount > 0) ||
      (pendingCount > 0 && taskStatus === TaskStatus.Finished),
    [failedCount, loadingOrNoStatus, pendingCount, taskStatus]
  );

  return { canRun, canStop, canRestartFailed };
};
