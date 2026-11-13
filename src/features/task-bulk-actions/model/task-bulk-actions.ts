import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";

import { runInBatches } from "saltbox-core/shared/utils/run-in-batches";
import { getTaskPermissions } from "saltbox-core/shared/utils/task-permissions";
import { apiCoreStore } from "saltbox-core/store";

const BATCH_SIZE = 5;

export type TaskBulkActionResult = {
  succeeded: number;
  failedTaskIds: string[];
};

const getTasksApi = () => {
  const tasksApi = apiCoreStore.tasksApi;
  if (!tasksApi) {
    throw new Error("Tasks API is not available");
  }
  return tasksApi;
};

export const getStoppableTasks = (tasks: TaskListResponseSchema[]): TaskListResponseSchema[] =>
  tasks.filter(
    (task) =>
      getTaskPermissions({
        taskStatus: task.status?.type,
        failedCount: task.minions_count?.failed,
        pendingCount: task.minions_count?.pending,
      }).canStop
  );

export const stopTasks = async (tasks: TaskListResponseSchema[]): Promise<TaskBulkActionResult> => {
  const tasksApi = getTasksApi();
  const results = await runInBatches(
    tasks,
    (task) => tasksApi.taskStop({ tid: task.id }),
    BATCH_SIZE
  );

  const failedTaskIds = tasks
    .filter((_, index) => results[index].status === "rejected")
    .map((task) => task.id);

  return { succeeded: tasks.length - failedTaskIds.length, failedTaskIds };
};
