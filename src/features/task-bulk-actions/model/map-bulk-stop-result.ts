import { TaskBulkStopResult, TaskStatus } from "@saltbox/saltbox-core-api-client";

export type TaskBulkActionResult = {
  succeeded: number;
  skipped: number;
  failedTaskIds: string[];
  notFoundTaskIds: string[];
};

export const mapBulkStopResult = (
  taskIds: string[],
  results: TaskBulkStopResult[]
): TaskBulkActionResult => {
  const statuses = new Map(results.map(({ task_id, status }) => [task_id, status]));
  const result: TaskBulkActionResult = {
    succeeded: 0,
    skipped: 0,
    failedTaskIds: [],
    notFoundTaskIds: [],
  };

  for (const id of taskIds) {
    const status = statuses.get(id);
    if (status === undefined) {
      result.notFoundTaskIds.push(id);
    } else if (status === TaskStatus.Stopping || status === TaskStatus.Stopped) {
      result.succeeded++;
    } else if (status === TaskStatus.Finished || status === TaskStatus.Created) {
      result.skipped++;
    } else {
      result.failedTaskIds.push(id);
    }
  }

  return result;
};
