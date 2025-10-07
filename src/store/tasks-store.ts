import { PaginationState } from "@tanstack/react-table";
import { action, makeAutoObservable, makeObservable, observable, runInAction } from "mobx";
import {
  TaskListResponseSchema,
  TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class TasksStore {
  @observable tasks: Array<TaskListResponseSchema>;
  @observable isTasksLoading: boolean;
  @observable collectionSlug: string | null;
  @observable mongoDBQuery: object | undefined;

  @observable total: number;
  @observable pagination: PaginationState;

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

  @action handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
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
    this.collectionSlug = slug;
    if (this.collectionSlug) {
      this.loadTasks(this.collectionSlug);
    }
  };
}
