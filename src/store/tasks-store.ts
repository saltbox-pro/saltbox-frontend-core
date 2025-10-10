import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, makeObservable, observable, runInAction } from "mobx";
import {
  TaskListResponseSchema,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class TasksStore {
  @observable tasks: Array<TaskListResponseSchema>;
  @observable isTasksLoading: boolean;
  @observable collectionSlug: string | null;
  @observable mongoDBQuery: object | undefined;

  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;

  constructor() {
    makeObservable(this);

    this.tasks = [];
    this.total = 0;
    this.isTasksLoading = false;
    this.collectionSlug = null;

    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.sorting = [...DEFAULT_SORTING];
  }

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
        }
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
    this.pagination = pagination;
    this.sorting = sorting;
    if (this.collectionSlug) {
      this.loadTasks(this.collectionSlug);
    }
  };

  @action handleSearch = (collectionSlug?: string) => {
    this.pagination.pageIndex = 0;
    this.loadTasks(collectionSlug);
  };

  @action updateTask = (task: TaskModel) => {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index > -1) {
      this.tasks[index] = task;
      this.tasks = [...this.tasks];
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
