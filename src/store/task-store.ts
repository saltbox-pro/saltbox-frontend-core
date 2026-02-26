import {
  JobReturnModel,
  JobsListResponse,
  TaskCreateRequestSchema,
  TaskMinionModel,
  TaskMinionStatus,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

const PAGE_SIZE = 50;
const DEFAULT_SORTING: SortingState = [{ id: "start_last_dt", desc: true }];

export class TaskStore {
  @observable task: TaskModel | null;
  @observable jobReturns: Array<JobReturnModel>;
  @observable minions: Array<TaskMinionModel>;
  @observable totalMinions: number;
  @observable isRunTaskLoading: boolean;
  @observable isStopTaskLoading: boolean;
  @observable isRestartFailedLoading: boolean;
  @observable minionsPagination: PaginationState;
  @observable minionsSorting: SortingState;
  @observable isMinionsLoading: boolean;
  @observable minionCategoryFilter: TaskMinionStatus | null;
  @observable jobs: Array<JobsListResponse>;
  @observable loadingCounter: number;
  @observable error: string | null;

  constructor() {
    this.task = null;
    this.jobReturns = [];
    this.minions = [];
    this.totalMinions = 0;
    this.isRunTaskLoading = false;
    this.isStopTaskLoading = false;
    this.isRestartFailedLoading = false;

    this.minionsPagination = { pageIndex: 0, pageSize: PAGE_SIZE };
    this.minionsSorting = [...DEFAULT_SORTING];
    this.isMinionsLoading = false;
    this.minionCategoryFilter = null;
    this.jobs = [];
    this.loadingCounter = 0;
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

  @computed
  get isTaskLoading() {
    return this.loadingCounter > 0;
  }

  @action
  private startLoading = () => {
    this.loadingCounter += 1;
  };

  @action
  private finishLoading = () => {
    this.loadingCounter = Math.max(0, this.loadingCounter - 1);
  };

  @action
  reload = (taskId: string) => {
    this.loadTask(taskId);
  };

  @action
  loadTask = (taskId: string) => {
    this.startLoading();
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
          this.minionCategoryFilter = null;
          this.minionsPagination.pageIndex = 0;
          this.loadMinions(taskId, { loadJobs: true });
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
          this.finishLoading();
        });
      });
  };

  @action
  loadJobReturns = (taskId: string) => {
    this.startLoading();
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
          this.finishLoading();
        });
      });
  };

  @action
  loadMinions = (taskId: string, options?: { loadJobs?: boolean }) => {
    const loadJobs = options?.loadJobs ?? false;
    this.isMinionsLoading = true;
    const query =
      this.minionCategoryFilter != null ? { status: this.minionCategoryFilter } : undefined;
    apiCoreStore.tasksApi
      ?.tasksMinions({
        tid: taskId,
        TaskMinionListBody: {
          limit: this.minionsPagination.pageSize,
          skip: this.minionsPagination.pageIndex * this.minionsPagination.pageSize,
          sort: toBackendSorting(this.minionsSorting),
          query,
        },
      })
      .then((response) => {
        runInAction(() => {
          this.minions = response.data;
          this.totalMinions = response.total;
        });
        if (loadJobs) {
          this.loadJobs(taskId);
        }
      })
      .catch((error) => {
        console.error("Error loading task minions:", error);
        runInAction(() => {
          this.error = "Failed to load task minions";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isMinionsLoading = false;
        });
      });
  };

  @action
  handleMinionsLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.minionsPagination.pageIndex = pagination.pageIndex;
    this.minionsPagination.pageSize = pagination.pageSize;
    this.minionsSorting = sorting;
    if (this.task?.id) {
      this.loadMinions(this.task.id);
    }
  };

  @action
  setMinionCategoryFilter = (status: TaskMinionStatus | null) => {
    this.minionCategoryFilter = status;
    this.minionsPagination.pageIndex = 0;
    if (this.task?.id) {
      this.loadMinions(this.task.id);
    }
  };

  @action
  loadJobs = (taskId: string) => {
    this.startLoading();
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
        });
      })
      .finally(() => {
        runInAction(() => {
          this.finishLoading();
        });
      });
  };

  @action
  addJobReturn = (jobReturn: JobReturnModel) => {
    this.jobReturns = [...this.jobReturns, jobReturn];
  };

  @action
  handleRunTask = async () => {
    if (!this.task) {
      return Promise.reject(new Error("Task is not loaded"));
    }
    this.isRunTaskLoading = true;
    this.startLoading();

    const promise = apiCoreStore.tasksApi?.taskRun({
      tid: this.task.id,
    });

    if (!promise) {
      this.finishLoading();
      this.isRunTaskLoading = false;
      return Promise.reject(new Error("Tasks API is not available"));
    }

    try {
      try {
        const task = await promise;
        runInAction(() => {
          this.task = task;
        });
      } catch (error) {
        console.error("Error running task:", error);
        throw error;
      }
    } finally {
      runInAction(() => {
        this.finishLoading();
        this.isRunTaskLoading = false;
      });
    }
  };

  @action
  handleStopTask = async () => {
    if (!this.task) {
      return Promise.reject(new Error("Task is not loaded"));
    }
    this.isStopTaskLoading = true;
    this.startLoading();

    const promise = apiCoreStore.tasksApi?.taskStop({
      tid: this.task.id,
    });

    if (!promise) {
      this.finishLoading();
      this.isStopTaskLoading = false;
      return Promise.reject(new Error("Tasks API is not available"));
    }

    try {
      try {
        const task = await promise;
        runInAction(() => {
          this.task = task;
        });
      } catch (error) {
        console.error("Error stopping task:", error);
        throw error;
      }
    } finally {
      runInAction(() => {
        this.finishLoading();
        this.isStopTaskLoading = false;
      });
    }
  };

  @action
  handleRestartFailed = async () => {
    if (!this.task) {
      return Promise.reject(new Error("Task is not loaded"));
    }
    this.isRestartFailedLoading = true;
    this.startLoading();

    const promise = apiCoreStore.tasksApi?.restartFailed({
      tid: this.task.id,
      RestartFailedBody: {},
    });

    if (!promise) {
      this.finishLoading();
      this.isRestartFailedLoading = false;
      return Promise.reject(new Error("Tasks API is not available"));
    }

    try {
      try {
        const task = await promise;
        runInAction(() => {
          this.task = task;
        });
      } catch (error) {
        console.error("Error restarting failed minions:", error);
        throw error;
      }
    } finally {
      runInAction(() => {
        this.isRestartFailedLoading = false;
        this.finishLoading();
      });
    }
  };

  @action
  handleRestartFailedMinion = async (minionInnerId: string) => {
    if (!this.task) {
      return Promise.reject(new Error("Task is not loaded"));
    }
    this.isRestartFailedLoading = true;
    this.startLoading();

    const promise = apiCoreStore.tasksApi?.restartFailed({
      tid: this.task.id,
      RestartFailedBody: { minions_by_ids: [minionInnerId] },
    });

    if (!promise) {
      this.finishLoading();
      this.isRestartFailedLoading = false;
      return Promise.reject(new Error("Tasks API is not available"));
    }

    try {
      try {
        const task = await promise;
        runInAction(() => {
          this.task = task;
          const index = this.minions.findIndex((m) => m.minion_inner_id === minionInnerId);
          if (index > -1) {
            const minion = this.minions[index];
            this.minions[index] = {
              ...minion,
              status: TaskMinionStatus.Pending,
            };
            this.minions = [...this.minions];
          }
        });
      } catch (error) {
        console.error("Error restarting failed minion:", error);
        throw error;
      }
    } finally {
      runInAction(() => {
        this.isRestartFailedLoading = false;
        this.finishLoading();
      });
    }
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
    } else if (this.minionsPagination.pageIndex === 0) {
      const newMinions = [minion, ...this.minions];
      this.minions =
        newMinions.length > this.minionsPagination.pageSize
          ? newMinions.slice(0, this.minionsPagination.pageSize)
          : newMinions;
      this.totalMinions += 1;
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
