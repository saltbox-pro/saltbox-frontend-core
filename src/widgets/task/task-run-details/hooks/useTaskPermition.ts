import { TaskStatus } from "@saltbox/saltbox-core-api-client";

import type { TaskStore } from "saltbox-core/store";

export const useTaskPermissions = (taskStore: TaskStore) => {
  const isTaskLoading = taskStore.isTaskLoading || !taskStore.task?.status;
  const taskStatus = taskStore.task?.status?.type;

  const canRun =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.WaitMinions &&
    taskStatus !== TaskStatus.Running &&
    taskStatus !== TaskStatus.Stopping;

  const canStop =
    !isTaskLoading &&
    taskStatus !== TaskStatus.Created &&
    taskStatus !== TaskStatus.Finished &&
    taskStatus !== TaskStatus.Stopping &&
    taskStatus !== TaskStatus.Stopped;

  const canRestartFailed =
    (!isTaskLoading &&
      taskStatus !== TaskStatus.Stopping &&
      taskStatus !== TaskStatus.Created &&
      taskStore.task?.minions_count?.failed > 0) ||
    (taskStore.task?.minions_count?.pending > 0 && taskStatus === TaskStatus.Finished);

  return { canRun, canStop, canRestartFailed };
};
