import { TaskListResponseSchema, TaskStatus } from "@saltbox/saltbox-core-api-client";

import { getTaskPermissions } from "saltbox-core/shared/utils/task-permissions";
import { apiCoreStore } from "saltbox-core/store";

export type TaskBulkActionResult = {
  succeeded: number;
  skipped: number;
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
  const taskIds = tasks.map((task) => task.id);
  const results = await getTasksApi().tasksBulkStop({
    TaskBulkStopBody: { task_ids: taskIds },
  });
  const statuses = new Map(results.map(({ task_id, status }) => [task_id, status]));
  const result: TaskBulkActionResult = { succeeded: 0, skipped: 0, failedTaskIds: [] };

  for (const id of taskIds) {
    const status = statuses.get(id);
    if (status === TaskStatus.Stopping || status === TaskStatus.Stopped) {
      result.succeeded++;
    } else if (status === TaskStatus.Finished || status === TaskStatus.Created) {
      result.skipped++;
    } else {
      result.failedTaskIds.push(id);
    }
  }
  return result;
};
