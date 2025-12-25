import {
  JobReturnModel,
  JobsListResponse,
  TaskCreateRequestSchema,
  TaskMinionModel,
  TaskMinionStatus,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class TaskStore {
  @observable task: TaskModel | null;
  @observable jobReturns: Array<JobReturnModel>;
  @observable minions: Array<TaskMinionModel>;
  @observable jobs: Array<JobsListResponse>;
  @observable isTaskLoading: boolean;
  @observable error: string | null;

  constructor() {
    this.task = null;
    this.jobReturns = [];
    this.minions = [];
    this.jobs = [];
    this.isTaskLoading = false;
    this.error = null;
    makeObservable(this);
  }

  @computed
  get jobsCount() {
    return this.jobs.length;
  }

  @computed
  get failedMinionsCount() {
    return this.minions?.filter((minion) => minion.status === TaskMinionStatus.Failed).length ?? 0;
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
          this.loadMinions(taskId);
        });
      })
      .catch((error) => {
        console.error("Error loading task:", error);
        runInAction(() => {
          this.error = "Failed to load task";
          this.isTaskLoading = false;
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
    apiCoreStore.jobsApi
      ?.jobReturnsList({
        JobReturnsListBody: {
          query: { "source.type": "task", "source.id": taskId },
        },
      })
      .then((response) => {
        runInAction(() => {
          this.jobReturns = response.data;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  @action
  loadMinions = (taskId: string) => {
    this.isTaskLoading = true;
    apiCoreStore.tasksApi
      ?.tasksMinions({
        tid: taskId,
        TaskMinionListBody: {},
      })
      .then((response) => {
        runInAction(() => {
          this.minions = response.data;
          this.loadJobs(taskId);
        });
      })
      .catch((error) => {
        console.error("Error loading task minions:", error);
        runInAction(() => {
          this.error = "Failed to load task minions";
          this.isTaskLoading = false;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTaskLoading = false;
        });
      });
  };

  @action
  loadJobs = (taskId: string) => {
    this.isTaskLoading = true;
    apiCoreStore.jobsApi
      .jobsList({
        JobListBody: {
          query: {
            "source.type": "task",
            "source.id": taskId,
          },
        },
      })
      .then((response) => {
        runInAction(() => {
          this.jobs = response?.data ?? [];
          this.loadJobReturns(taskId);
        });
      })
      .catch((error) => {
        console.error("Error loading task jobs:", error);
        runInAction(() => {
          this.error = "Failed to load task jobs";
          this.isTaskLoading = false;
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
      .restartFailed({ tid: this.task.id, RestartFailedBody: {} })
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
  createTask = (form: TaskCreateRequestSchema): Promise<TaskModel> => {
    return new Promise<TaskModel>((resolve, reject) => {
      apiCoreStore.tasksApi
        ?.taskCreate({
          TaskCreateRequestSchema: form,
        })
        .then((taskTemplate) => {
          resolve(taskTemplate);
        })
        .catch(reject);
    });
  };

  @action
  updateTasks = (tasks: TaskModel[]) => {
    const sortedTasks = tasks.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
    this.task = sortedTasks.at(0) ?? null;
  };

  @action
  updateJobs = (jobs: JobsListResponse[]) => {
    const sortedJobs = jobs.sort(
      (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
    );
    sortedJobs.map((job) => this.updateJob(job));
  };

  @action
  updateJob = (job: JobsListResponse) => {
    const index = this.jobs.findIndex(
      (item) => item.jid === job.jid && item.salt_master === job.salt_master
    );
    if (index > -1) {
      this.jobs[index] = job;
      this.jobs = [...this.jobs];
    } else {
      this.jobs = [job, ...this.jobs];
    }
  };

  @action
  updateMinions = (minions: TaskMinionModel[]) => {
    const sortedMinions = minions.sort(
      (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
    );
    sortedMinions.map((minion) => this.updateMinion(minion));
  };

  @action
  updateMinion = (minion: TaskMinionModel) => {
    const index = this.minions.findIndex((item) => item.minion_inner_id === minion.minion_inner_id);
    if (index > -1) {
      this.minions[index] = minion;
      this.minions = [...this.minions];
    } else {
      this.minions = [minion, ...this.minions];
    }
  };

  @action
  updateJobReturns = (jobReturns: JobReturnModel[]) => {
    const sortedJobReturns = jobReturns.sort(
      (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
    );
    sortedJobReturns.map((jobReturn) => this.updateJobReturn(jobReturn));
  };

  @action
  updateJobReturn = (jobReturn: JobReturnModel) => {
    const index = this.jobReturns.findIndex((item) => item.id === jobReturn.id);
    if (index > -1) {
      this.jobReturns[index] = jobReturn;
      this.jobReturns = [...this.jobReturns];
    } else {
      this.jobReturns = [jobReturn, ...this.jobReturns];
    }
  };
}
