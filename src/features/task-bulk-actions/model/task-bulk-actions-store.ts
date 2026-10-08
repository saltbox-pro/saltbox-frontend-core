import { TaskListResponseSchema, TaskModel } from "@saltbox/saltbox-core-api-client";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { runWithConcurrency } from "saltbox-core/shared/utils/run-with-concurrency";
import {
  getTaskPermissions,
  type TaskPermissions,
} from "saltbox-core/shared/utils/task-permissions";
import { apiCoreStore } from "saltbox-core/store";

const BULK_ACTION_CONCURRENCY = 5;

export type TaskBulkAction = "run" | "stop" | "restartFailed";

export type TaskBulkActionResult = {
  succeeded: number;
  failedTaskIds: string[];
  skipped: number;
};

const PERMISSION_BY_ACTION: Record<TaskBulkAction, keyof TaskPermissions> = {
  run: "canRun",
  stop: "canStop",
  restartFailed: "canRestartFailed",
};

export const isTaskBulkActionAvailable = (
  bulkAction: TaskBulkAction,
  task: TaskListResponseSchema
): boolean => {
  const permissions = getTaskPermissions({
    taskStatus: task.status?.type,
    failedCount: task.minions_count?.failed,
    pendingCount: task.minions_count?.pending,
  });
  return permissions[PERMISSION_BY_ACTION[bulkAction]];
};

export const getTasksForBulkAction = (
  bulkAction: TaskBulkAction,
  tasks: TaskListResponseSchema[]
): TaskListResponseSchema[] => tasks.filter((task) => isTaskBulkActionAvailable(bulkAction, task));

const runTaskAction = (bulkAction: TaskBulkAction, taskId: string): Promise<TaskModel> => {
  const tasksApi = apiCoreStore.tasksApi;
  if (!tasksApi) {
    return Promise.reject(new Error("Tasks API is not available"));
  }

  if (bulkAction === "run") {
    return tasksApi.taskRun({ tid: taskId });
  }
  if (bulkAction === "stop") {
    return tasksApi.taskStop({ tid: taskId });
  }
  return tasksApi.restartFailed({ tid: taskId, RestartFailedBody: {} });
};

export class TaskBulkActionsStore {
  @observable runningAction: TaskBulkAction | null;
  private readonly onTaskUpdated: (task: TaskModel) => void;

  constructor(onTaskUpdated: (task: TaskModel) => void) {
    this.runningAction = null;
    this.onTaskUpdated = onTaskUpdated;
    makeObservable(this);
  }

  @computed get isRunning(): boolean {
    return this.runningAction !== null;
  }

  @action execute = async (
    bulkAction: TaskBulkAction,
    tasks: TaskListResponseSchema[]
  ): Promise<TaskBulkActionResult> => {
    const eligibleTasks = getTasksForBulkAction(bulkAction, tasks);
    this.runningAction = bulkAction;

    try {
      const results = await runWithConcurrency(
        eligibleTasks,
        (task) => runTaskAction(bulkAction, task.id),
        BULK_ACTION_CONCURRENCY
      );

      const failedTaskIds: string[] = [];
      runInAction(() => {
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            this.onTaskUpdated(result.value);
            return;
          }
          failedTaskIds.push(eligibleTasks[index].id);
        });
      });

      return {
        succeeded: eligibleTasks.length - failedTaskIds.length,
        failedTaskIds,
        skipped: tasks.length - eligibleTasks.length,
      };
    } finally {
      runInAction(() => {
        this.runningAction = null;
      });
    }
  };
}
