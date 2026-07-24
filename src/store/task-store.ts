import {
  JobReturnModel,
  TaskCreateRequestSchema,
  TaskMinionListResponse,
  TaskMinionStatus,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import {
  createNotFoundError,
  createResourceLoadError,
  type ResourceLoadError,
  toBackendSorting,
} from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import {
  TaskJobReturnsStore,
  type TaskJobReturnsContext,
  type TaskJobReturnsErrorKey,
} from "saltbox-core/features/task/job-return";
import { apiCoreStore } from "saltbox-core/store";

const PAGE_SIZE = 50;
const DEFAULT_SORTING: SortingState = [{ id: "start_last_dt", desc: true }];

export class TaskStore {
  @observable task: TaskModel | null;
  @observable minions: Array<TaskMinionListResponse>;
  @observable totalMinions: number;
  @observable isRunTaskLoading: boolean;
  @observable isStopTaskLoading: boolean;
  @observable isRestartFailedLoading: boolean;
  @observable minionsPagination: PaginationState;
  @observable minionsSorting: SortingState;
  @observable isMinionsLoading: boolean;
  @observable minionCategoryFilter: TaskMinionStatus | null;
  @observable loadingCounter: number;
  @observable loadError: ResourceLoadError | null;
  taskJobReturnsStore: TaskJobReturnsStore;

  constructor() {
    this.task = null;
    this.minions = [];
    this.totalMinions = 0;
    this.isRunTaskLoading = false;
    this.isStopTaskLoading = false;
    this.isRestartFailedLoading = false;

    this.minionsPagination = { pageIndex: 0, pageSize: PAGE_SIZE };
    this.minionsSorting = [...DEFAULT_SORTING];
    this.isMinionsLoading = false;
    this.minionCategoryFilter = null;
    this.loadingCounter = 0;
    this.loadError = null;
    this.taskJobReturnsStore = new TaskJobReturnsStore(() => this.task?.id ?? null);
    makeObservable(this);
  }

  @computed
  get taskJobReturnsHasData(): boolean {
    return this.taskJobReturnsStore.taskJobReturnsHasData;
  }

  get taskJobReturnsContext(): TaskJobReturnsContext | null {
    return this.taskJobReturnsStore.taskJobReturnsContext;
  }

  get taskJobReturns(): JobReturnModel[] {
    return this.taskJobReturnsStore.taskJobReturns;
  }

  get taskJobReturnsLoading(): boolean {
    return this.taskJobReturnsStore.taskJobReturnsLoading;
  }

  get taskJobReturnsError(): TaskJobReturnsErrorKey {
    return this.taskJobReturnsStore.taskJobReturnsError;
  }

  get taskJobReturnsFetched(): boolean {
    return this.taskJobReturnsStore.taskJobReturnsFetched;
  }

  get taskJobReturnsDrawerMinion(): TaskMinionListResponse | null {
    return this.taskJobReturnsStore.drawerMinion;
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
    this.loadError = null;
    apiCoreStore.tasksApi
      ?.taskRetrieve({
        tid: taskId,
      })
      .then((task) => {
        if (!task) {
          runInAction(() => {
            this.loadError = createNotFoundError();
          });
          return;
        }
        runInAction(() => {
          this.task = task;
          this.minionCategoryFilter = null;
          this.minionsPagination.pageIndex = 0;
          this.loadMinions(taskId);
        });
      })
      .catch((error) => {
        console.error("Error loading task:", error);
        runInAction(() => {
          this.loadError = createResourceLoadError(error);
        });
      })
      .finally(() => {
        runInAction(() => {
          this.finishLoading();
        });
      });
  };

  @action
  loadMinions = (taskId: string) => {
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
      })
      .catch((error) => {
        console.error("Error loading task minions:", error);
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
    if (!tasks || tasks.length === 0) {
      return;
    }
    const sortedTasks = tasks.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
    this.task = sortedTasks.at(0) ?? null;
  };

  @action
  updateMinions = (minions: TaskMinionListResponse[]) => {
    const sortedMinions = minions.sort(
      (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
    );
    const hasNewMinion = sortedMinions.some((minion) => {
      const minionIdentity = minion.minion_inner_id ?? minion.id ?? minion.minion_id;
      if (!minionIdentity) {
        return false;
      }
      return !this.minions.some((item) => {
        const itemIdentity = item.minion_inner_id ?? item.id ?? item.minion_id;
        return itemIdentity === minionIdentity;
      });
    });
    sortedMinions.map((minion) => this.updateMinion(minion));
    if (hasNewMinion && this.task?.id) {
      this.loadMinions(this.task.id);
    }
  };

  @action
  updateMinion = (minion: TaskMinionListResponse) => {
    const index = this.minions.findIndex((item) => item.minion_inner_id === minion.minion_inner_id);
    if (index > -1) {
      this.minions[index] = minion;
      this.minions = [...this.minions];
    }
    this.taskJobReturnsStore.syncDrawerMinionFromTaskMinion(minion);
  };

  resetTaskJobReturns = () => this.taskJobReturnsStore.reset();

  setTaskJobReturnsContext = (minion: TaskMinionListResponse | null) =>
    this.taskJobReturnsStore.setContext(minion);

  setTaskJobReturnsLoadError = (key: TaskJobReturnsErrorKey) =>
    this.taskJobReturnsStore.setLoadError(key);

  applyTaskJobReturnsDrawerMinionFromTableRow = (
    row: TaskMinionListResponse | null,
    openedMongoId: string | null | undefined
  ) => {
    this.taskJobReturnsStore.applyDrawerMinionFromTableRow(row, openedMongoId);
  };

  loadTaskJobReturns = async (taskId: string, taskMinionMongoId: string) => {
    const minion = this.taskJobReturnsDrawerMinion;
    if (!minion?.id || minion.id !== taskMinionMongoId) {
      this.setTaskJobReturnsLoadError("missing-context");
      return;
    }
    return await this.taskJobReturnsStore.load(taskId, taskMinionMongoId, minion);
  };

  mergeTaskJobReturnsFromSocket = (jobReturns: JobReturnModel[]) => {
    this.taskJobReturnsStore.mergeManyFromSocket(jobReturns);
  };
}
