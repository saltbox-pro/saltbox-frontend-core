import { TaskStatus } from "@saltbox/saltbox-core-api-client";

export type TaskPermissionsInput = {
  taskStatus: TaskStatus | undefined;
  failedCount: number | undefined;
  pendingCount: number | undefined;
};

export type TaskPermissions = {
  canRun: boolean;
  canStop: boolean;
  canRestartFailed: boolean;
};

export const getTaskPermissions = ({
  taskStatus,
  failedCount = 0,
  pendingCount = 0,
}: TaskPermissionsInput): TaskPermissions => {
  if (taskStatus === undefined) {
    return { canRun: false, canStop: false, canRestartFailed: false };
  }

  const canRun =
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.WaitMinions &&
    taskStatus !== TaskStatus.Running &&
    taskStatus !== TaskStatus.Stopping;

  const canStop =
    taskStatus !== TaskStatus.Created &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.Stopping &&
    taskStatus !== TaskStatus.Stopped;

  const canRestartFailed =
    (taskStatus !== TaskStatus.Stopping && taskStatus !== TaskStatus.Created && failedCount > 0) ||
    (pendingCount > 0 && taskStatus === TaskStatus.Finished);

  return { canRun, canStop, canRestartFailed };
};
