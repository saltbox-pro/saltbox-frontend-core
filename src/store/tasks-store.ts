import { TaskListResponseSchema, TaskModel } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, makeObservable, observable, runInAction } from "mobx";
import { OptionList } from "react-querybuilder";

import { apiCoreStore, TasksFilterStore } from "saltbox-core/store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class TasksStore {
  @observable tasks: Array<TaskListResponseSchema>;
  @observable isTasksLoading: boolean;
  @observable collectionSlug: string | null;
  @observable mongoDBQuery: object | undefined;

  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable filterStore: TasksFilterStore;

  constructor() {
    this.tasks = [];
    this.total = 0;
    this.isTasksLoading = false;
    this.collectionSlug = null;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.sorting = [...DEFAULT_SORTING];
    makeObservable(this);
  }

  @action init = (filterSchema: OptionList) => {
    this.filterStore = new TasksFilterStore(filterSchema);
    this.tasks = [];
    this.total = 0;
    this.isTasksLoading = false;
    this.collectionSlug = null;
    this.pagination.pageIndex = 0;
    this.pagination.pageSize = 50;
    this.sorting = [...DEFAULT_SORTING];
  };

  @action loadTasks = (collectionSlug?: string) => {
    if (!collectionSlug) return;
    this.collectionSlug = collectionSlug;
    this.isTasksLoading = true;
    apiCoreStore.tasksApi
      ?.tasksList({
        TaskListBody: {
          query: {
            "target_collection.slug": this.collectionSlug,
            ...this.mongoDBQuery,
          },
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((tasks) => {
        runInAction(() => {
          this.total = tasks.total ?? 0;
          this.tasks = tasks.data ?? [];
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTasksLoading = false;
        });
      });
  };

  @action handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    if (this.collectionSlug) {
      this.loadTasks(this.collectionSlug);
    }
  }

  @action handleSearch = (collectionSlug?: string) => {
    this.pagination.pageIndex = 0;
    this.loadTasks(collectionSlug);
  };

  @action updateTask = (task: TaskModel) => {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index > -1) {
      this.tasks[index] = task;
      this.tasks = [...this.tasks];
    } else if (this.pagination.pageIndex === 0) {
      let newTasks = [task, ...this.tasks];
      if (newTasks.length > this.pagination.pageSize) {
        newTasks = newTasks.slice(0, this.pagination.pageSize);
      } else {
        this.total++;
      }
      this.tasks = newTasks;
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

export const tasksStore = new TasksStore();
