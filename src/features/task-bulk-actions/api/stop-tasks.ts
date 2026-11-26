import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import { mapBulkStopResult, type TaskBulkActionResult } from "../model/map-bulk-stop-result";

import { TasksApiUnavailableError } from "./tasks-api-unavailable-error";

export const stopTasks = async (tasks: TaskListResponseSchema[]): Promise<TaskBulkActionResult> => {
  if (tasks.length === 0) {
    return { succeeded: 0, skipped: 0, failedTaskIds: [], notFoundTaskIds: [] };
  }

  const tasksApi = apiCoreStore.tasksApi;
  if (!tasksApi) {
    throw new TasksApiUnavailableError();
  }

  const taskIds = tasks.map((task) => task.id);
  const results = await tasksApi.tasksBulkStop({
    TaskBulkStopBody: { task_ids: taskIds },
  });

  return mapBulkStopResult(taskIds, results);
};
