import { TaskListResponseSchema, TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class TasksStore {
  @observable tasks: Array<TaskListResponseSchema>;
  @observable collectionSlug: string | null;
  @observable mongoDBQuery: object | undefined;
  @observable taskType: TaskType;

  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;

  readonly tasksLoad = createLoader({
    run: () =>
      apiCoreStore.tasksApi?.tasksList({
        TaskListBody: {
          query: {
            ...(this.collectionSlug ? { "target_collection.slug": this.collectionSlug } : {}),
            task_type: this.taskType,
            ...this.mongoDBQuery,
          },
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      }),
    onSuccess: (tasks) => {
      this.total = tasks.total ?? 0;
      this.tasks = tasks.data ?? [];
    },
  });

  constructor(taskType: TaskType) {
    this.tasks = [];
    this.total = 0;
    this.collectionSlug = null;
    this.taskType = taskType;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.sorting = [...DEFAULT_SORTING];
    makeObservable(this);
  }

  @computed get isTasksLoading(): boolean {
    return this.tasksLoad.isLoading;
  }

  @action init = () => {
    this.tasks = [];
    this.total = 0;
    this.collectionSlug = null;
    this.pagination.pageIndex = 0;
    this.pagination.pageSize = 50;
    this.sorting = [...DEFAULT_SORTING];
  };

  @action loadTasks = (collectionSlug?: string) => {
    if (collectionSlug !== undefined) {
      this.collectionSlug = collectionSlug;
    }
    this.tasksLoad.run().catch(() => undefined);
  };

  @action handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadTasks();
  }

  @action handleSearch = (collectionSlug?: string) => {
    this.pagination.pageIndex = 0;
    this.loadTasks(collectionSlug);
  };

  @computed get hasActiveFilters(): boolean {
    return this.mongoDBQuery !== undefined && Object.keys(this.mongoDBQuery).length > 0;
  }

  @action updateTask = (task: TaskModel) => {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index > -1) {
      this.tasks[index] = task;
      this.tasks = [...this.tasks];
    } else if (this.pagination.pageIndex === 0 && !this.hasActiveFilters) {
      let newTasks = [task, ...this.tasks];
      if (newTasks.length > this.pagination.pageSize) {
        newTasks = newTasks.slice(0, this.pagination.pageSize);
      }
      this.tasks = newTasks;
      this.total++;
    }
  };

  @action updateTasks = (tasks: TaskListResponseSchema[]) => {
    tasks.map((task) => this.updateTask(task));
  };

  @action setCollectionSlug = (slug: string | undefined) => {
    this.pagination.pageIndex = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.collectionSlug = slug;
    if (this.collectionSlug) {
      this.loadTasks(this.collectionSlug);
    }
  };
}
