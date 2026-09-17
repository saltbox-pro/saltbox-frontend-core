import type { JobReturnModel, TaskMinionListResponse } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { sortJobReturnsChronologically } from "../utils/chronological-job-return-sort";
export type TaskJobReturnsContext = {
  taskMinionMongoId: string;
  minion_id: string;
  master: string;
};

export type TaskJobReturnsErrorKey = null | "missing-context";

export class TaskJobReturnsStore {
  @observable taskJobReturnsContext: TaskJobReturnsContext | null = null;
  @observable drawerMinion: TaskMinionListResponse | null = null;
  @observable taskJobReturns: JobReturnModel[] = [];
  @observable taskJobReturnsError: TaskJobReturnsErrorKey = null;
  @observable taskJobReturnsFetched: boolean = false;

  readonly taskJobReturnsLoad = createLoader({
    run: (taskId: string, taskMinionMongoId: string, signal: AbortSignal) =>
      apiCoreStore.tasksApi?.taskJobsReturns(
        { tid: taskId, task_minion_mongo_id: taskMinionMongoId },
        { signal }
      ),
    onSuccess: (list, _taskId, taskMinionMongoId) => {
      this.replace(list ?? []);
      this.taskJobReturnsFetched = true;
      this.loadedKey = taskMinionMongoId;
      this.loadingKey = null;
      this.taskJobReturnsError = null;
    },
  });

  private abortController: AbortController | null = null;
  private loadedKey: string | null = null;
  private loadingKey: string | null = null;
  private inFlightReturnsReload: Promise<void> | null = null;
  private queuedReturnsReload: boolean = false;

  constructor(private readonly getTaskId: () => string | null) {
    makeObservable(this);
  }

  @computed
  get taskJobReturnsLoading(): boolean {
    return this.taskJobReturnsLoad.isLoading;
  }

  @computed
  get taskJobReturnsHasData(): boolean {
    return this.taskJobReturnsFetched && this.taskJobReturnsError == null;
  }

  @action
  reset = () => {
    this.abortController?.abort();
    this.abortController = null;
    this.taskJobReturnsContext = null;
    this.drawerMinion = null;
    this.taskJobReturns = [];
    this.taskJobReturnsError = null;
    this.taskJobReturnsFetched = false;
    this.loadedKey = null;
    this.loadingKey = null;
  };

  @action
  setContext = (minion: TaskMinionListResponse | null) => {
    if (!minion?.id) {
      this.reset();
      return;
    }
    this.taskJobReturnsContext = {
      taskMinionMongoId: minion.id,
      minion_id: minion.minion_id,
      master: minion.master,
    };
    this.drawerMinion = minion;
    this.taskJobReturns = [];
    this.loadedKey = null;
    this.taskJobReturnsFetched = false;
  };

  @action
  setLoadError = (key: TaskJobReturnsErrorKey) => {
    this.abortController?.abort();
    this.abortController = null;
    this.taskJobReturnsFetched = false;
    this.loadedKey = null;
    this.loadingKey = null;
    this.taskJobReturnsContext = null;
    this.taskJobReturns = [];
    this.taskJobReturnsError = key;
  };

  @action
  private replace = (list: JobReturnModel[]) => {
    this.taskJobReturns = sortJobReturnsChronologically(list ?? []);
  };

  reloadTaskJobReturns = async (): Promise<void> => {
    const taskId = this.getTaskId();
    const ctx = this.taskJobReturnsContext;
    const expectedTaskId = taskId;
    const expectedTaskMinionMongoId = ctx?.taskMinionMongoId;
    if (!expectedTaskId || !expectedTaskMinionMongoId) return;

    if (this.inFlightReturnsReload) {
      this.queuedReturnsReload = true;
      await this.inFlightReturnsReload;
      if (this.queuedReturnsReload) {
        this.queuedReturnsReload = false;
        return await this.reloadTaskJobReturns();
      }
      return;
    }

    // Тихая догрузка по сокету: ошибку показывать нечем, данные на экране остаются прежними.
    const promise = (async () => {
      try {
        const list = await apiCoreStore.tasksApi?.taskJobsReturns({
          tid: expectedTaskId,
          task_minion_mongo_id: expectedTaskMinionMongoId,
        });
        if (!list) return;

        const isStillSameContext =
          this.getTaskId() === expectedTaskId &&
          this.taskJobReturnsContext?.taskMinionMongoId === expectedTaskMinionMongoId;
        if (!isStillSameContext) return;

        runInAction(() => {
          this.replace(list ?? []);
          this.taskJobReturnsFetched = true;
          this.taskJobReturnsError = null;
        });
      } catch (err) {
        console.error("reloadTaskJobReturns:", err);
      } finally {
        this.inFlightReturnsReload = null;
      }
    })();

    this.inFlightReturnsReload = promise;
    return await promise;
  };

  load = async (taskId: string, taskMinionMongoId: string, minion: TaskMinionListResponse) => {
    const key = taskMinionMongoId;
    if (this.loadedKey === key && this.taskJobReturnsFetched) {
      return;
    }
    if (this.taskJobReturnsLoading && this.loadingKey === key) {
      return;
    }

    this.abortController?.abort();
    const ac = new AbortController();
    this.abortController = ac;

    runInAction(() => {
      this.taskJobReturnsError = null;
      this.taskJobReturnsFetched = false;
      this.loadedKey = null;
      this.loadingKey = key;
      this.taskJobReturnsContext = {
        taskMinionMongoId: minion.id,
        minion_id: minion.minion_id,
        master: minion.master,
      };
      this.drawerMinion = minion;
      this.taskJobReturns = [];
    });

    await this.taskJobReturnsLoad.run(taskId, taskMinionMongoId, ac.signal);

    if (this.abortController === ac) {
      this.abortController = null;
    }
  };

  @action
  mergeManyFromSocket = (incoming: JobReturnModel[]) => {
    const ctx = this.taskJobReturnsContext;
    const currentTaskId = this.getTaskId();
    if (!ctx || !currentTaskId || incoming.length === 0) return;

    let list = [...this.taskJobReturns];
    let changed = false;
    const toRefetchData: string[] = [];

    for (const jobReturn of incoming) {
      const src = jobReturn.source;
      if (src?.type !== "task" || src?.id !== currentTaskId) continue;
      if (jobReturn.minion_id !== ctx.minion_id || jobReturn.salt_master !== ctx.master) continue;

      const idx = list.findIndex((r) => r.id === jobReturn.id);
      if (idx > -1) {
        const prev = list[idx];
        const statusChanged = prev?.status !== jobReturn?.status;
        list[idx] = { ...prev, ...jobReturn, data: prev?.data };

        if (statusChanged) {
          toRefetchData.push(jobReturn.id);
        }
      } else {
        list = [...list, jobReturn];
      }
      changed = true;
    }

    if (!changed) return;
    this.taskJobReturns = sortJobReturnsChronologically(list);

    if (toRefetchData.length > 0) {
      this.reloadTaskJobReturns();
    }
  };

  @action
  applyDrawerMinionFromTableRow = (
    row: TaskMinionListResponse | null,
    openedMongoId: string | null | undefined
  ) => {
    const id = openedMongoId?.trim();
    if (!id || !row?.id || row.id !== id) return;
    const ctx = this.taskJobReturnsContext;
    if (ctx && ctx.taskMinionMongoId !== row.id) return;
    this.drawerMinion = row;
  };

  @action
  syncDrawerMinionFromTaskMinion = (minion: TaskMinionListResponse) => {
    const ctx = this.taskJobReturnsContext;
    if (!ctx?.taskMinionMongoId || !minion?.id) return;
    if (minion.id !== ctx.taskMinionMongoId) return;
    this.drawerMinion = minion;
  };
}
