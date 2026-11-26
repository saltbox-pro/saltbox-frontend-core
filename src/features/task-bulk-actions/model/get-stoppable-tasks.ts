import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";

import { getTaskPermissions } from "saltbox-core/features/task-permissions";

export const getStoppableTasks = (tasks: TaskListResponseSchema[]): TaskListResponseSchema[] =>
  tasks.filter(
    (task) =>
      getTaskPermissions({
        taskStatus: task.status?.type,
        failedCount: task.minions_count?.failed,
        pendingCount: task.minions_count?.pending,
      }).canStop
  );
