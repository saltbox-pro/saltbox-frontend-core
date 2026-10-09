import { TaskListResponseSchema, TaskModel } from "@saltbox/saltbox-core-api-client";

import { runInBatches } from "saltbox-core/shared/utils/run-in-batches";
import {
  getTaskPermissions,
  type TaskPermissions,
} from "saltbox-core/shared/utils/task-permissions";
import { apiCoreStore } from "saltbox-core/store";

const BATCH_SIZE = 5;

export type TaskBulkAction = "run" | "stop" | "restartFailed";

export type TaskBulkActionResult = {
  succeeded: number;
  failedTaskIds: string[];
};

type TaskBulkActionDefinition = {
  permission: keyof TaskPermissions;
  request: (taskId: string) => Promise<TaskModel>;
};

const getTasksApi = () => {
  const tasksApi = apiCoreStore.tasksApi;
  if (!tasksApi) {
    throw new Error("Tasks API is not available");
  }
  return tasksApi;
};

const TASK_BULK_ACTIONS: Record<TaskBulkAction, TaskBulkActionDefinition> = {
  run: {
    permission: "canRun",
    request: (taskId) => getTasksApi().taskRun({ tid: taskId }),
  },
  stop: {
    permission: "canStop",
    request: (taskId) => getTasksApi().taskStop({ tid: taskId }),
  },
  restartFailed: {
    permission: "canRestartFailed",
    request: (taskId) => getTasksApi().restartFailed({ tid: taskId, RestartFailedBody: {} }),
  },
};

export const getTasksForBulkAction = (
  bulkAction: TaskBulkAction,
  tasks: TaskListResponseSchema[]
): TaskListResponseSchema[] =>
  tasks.filter(
    (task) =>
      getTaskPermissions({
        taskStatus: task.status?.type,
        failedCount: task.minions_count?.failed,
        pendingCount: task.minions_count?.pending,
      })[TASK_BULK_ACTIONS[bulkAction].permission]
  );

export const executeTaskBulkAction = async (
  bulkAction: TaskBulkAction,
  tasks: TaskListResponseSchema[]
): Promise<TaskBulkActionResult> => {
  const results = await runInBatches(
    tasks,
    (task) => TASK_BULK_ACTIONS[bulkAction].request(task.id),
    BATCH_SIZE
  );

  const failedTaskIds = tasks
    .filter((_, index) => results[index].status === "rejected")
    .map((task) => task.id);

  return { succeeded: tasks.length - failedTaskIds.length, failedTaskIds };
};
