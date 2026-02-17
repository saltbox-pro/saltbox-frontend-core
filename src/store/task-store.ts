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
  handleRunTask = () => {
    if (!this.task) {
      return;
    }
    this.startLoading();
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
          this.finishLoading();
        });
      });
  };

  @action
  handleStopTask = () => {
    if (!this.task) {
      return;
    }
    this.startLoading();
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
          this.finishLoading();
        });
      });
  };

  @action
  handleRestartFailed = () => {
    if (!this.task) {
      return;
    }
    this.startLoading();
    apiCoreStore.tasksApi
      .restartFailed({ tid: this.task.id, RestartFailedBody: {} })
      .then((task) => {
        runInAction(() => {
          this.task = task;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.finishLoading();
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
