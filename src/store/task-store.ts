import { makeAutoObservable, runInAction } from "mobx";
import {
  JobResult,
  TaskCreateRequestSchemaInput,
  TaskMinionStatus,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class TaskStore {
  task: TaskModel | null;
  jobReturns: Array<JobResult>;
  isTaskLoading: boolean;
  error: string | null;

  constructor() {
    makeAutoObservable(this);

    this.task = null;
    this.jobReturns = [];
    this.isTaskLoading = false;
    this.error = null;
  }

  get jobsCount() {
    return Object.keys(this.task?.jobs ?? {}).length;
  }

  get failedMinionsCount() {
    let count = 0;
    Object.entries(this.task?.minions ?? {}).forEach(([_, task]) => {
      if (task?.status === TaskMinionStatus.Failed) {
        count++;
      }
    });
    return count;
  }

  reload = (taskId: string) => {
    this.loadTask(taskId);
  };

  loadTask = (taskId: string) => {
    this.isTaskLoading = true;
    this.error = null;
    apiCoreStore.tasksApi
      ?.taskRetrieve({
        tid: taskId,
      })
      .then((task) => {
        if (!task) {
          this.error = "Task not found";
          return;
        }
        runInAction(() => {
          this.task = task;
          this.loadJobReturns(taskId);
        });
      })
      .catch((error) => {
        console.error("Error loading task:", error);
        runInAction(() => {
          this.error = "Failed to load task";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  loadJobReturns = (taskId: string) => {
    this.isTaskLoading = true;
    apiCoreStore.tasksApi
      ?.taskReturns({ tid: taskId })
      .then((jobReturns) => {
        runInAction(() => {
          this.jobReturns = jobReturns;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  addJobReturn = (jobReturn: JobResult) => {
    this.jobReturns = [...this.jobReturns, jobReturn];
  };

  handleRunTask = () => {
    if (!this.task) {
      return;
    }
    this.isTaskLoading = true;
    apiCoreStore.tasksApi
      ?.taskRun({
        tid: this.task.id,
      })
      .then((task) => {
        runInAction(() => {
          this.task = task;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  handleStopTask = () => {
    if (!this.task) {
      return;
    }
    this.isTaskLoading = true;
    apiCoreStore.tasksApi
      ?.taskStop({
        tid: this.task.id,
      })
      .then((task) => {
        runInAction(() => {
          this.task = task;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  handleRestartFailed = () => {
    if (!this.task) {
      return;
    }
    this.isTaskLoading = true;
    apiCoreStore.tasksApi
      ?.restartFailed({ tid: this.task.id })
      .then((task) => {
        runInAction(() => {
          this.task = task;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  createTask = (form: TaskCreateRequestSchemaInput): Promise<TaskModel> => {
    return new Promise<TaskModel>((resolve, reject) => {
      apiCoreStore.tasksApi
        ?.taskCreate({
          TaskCreateRequestSchemaInput: form,
        })
        .then((taskTemplate) => {
          resolve(taskTemplate);
        })
        .catch(reject);
    });
  };
}
