import { action, computed, makeObservable, observable, runInAction } from "mobx";
import {
  JobReturnModel,
  TaskCreateRequestSchemaInput,
  TaskMinionStatus,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class TaskStore {
  @observable task: TaskModel | null;
  @observable jobReturns: Array<JobReturnModel>;
  @observable isTaskLoading: boolean;
  @observable error: string | null;

  constructor() {
    this.task = null;
    this.jobReturns = [];
    this.isTaskLoading = false;
    this.error = null;
    makeObservable(this);
  }

  @computed
  get jobsCount() {
    return Object.keys(this.task?.jobs ?? {}).length;
  }

  @computed
  get failedMinionsCount() {
    let count = 0;
    Object.entries(this.task?.minions ?? {}).forEach(([_, task]) => {
      if (task?.status === TaskMinionStatus.Failed) {
        count++;
      }
    });
    return count;
  }

  @action
  reload = (taskId: string) => {
    this.loadTask(taskId);
  };

  @action
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

  @action
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

  @action
  addJobReturn = (jobReturn: JobReturnModel) => {
    this.jobReturns = [...this.jobReturns, jobReturn];
  };

  @action
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

  @action
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

  @action
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

  @action
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

  @action
  updateTaskData = (update: Object & { retcode?: number, jobs?: TaskModel }[]) => {
    update.forEach((item) => {
      if (item?.retcode !== undefined) {
        this.addJobReturn(item as unknown as JobReturnModel);
      } else if (item?.jobs !== undefined) {
        runInAction(() => {
          this.task = item as unknown as TaskModel;
        });
      }
    });
  };
}
