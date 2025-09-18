import { PaginationState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";
import { TaskListResponseSchema, TaskModel } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class TasksStore {
  tasks: Array<TaskListResponseSchema>;
  isTasksLoading: boolean;
  collectionSlug: string | null;
  sourceType: string | null;

  total: number;
  pagination: PaginationState;

  constructor() {
    makeAutoObservable(this);

    this.tasks = [];
    this.total = 0;
    this.isTasksLoading = false;
    this.collectionSlug = null;
    this.sourceType = null;

    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  loadTasks = (collectionSlug?: string, sourceType?: string) => {
    if (!collectionSlug) return;
    this.collectionSlug = collectionSlug;
    this.sourceType = sourceType;
    this.isTasksLoading = true;
    apiCoreStore.tasksApi
      ?.tasksList({
        collection_slug: this.collectionSlug,
        limit: this.pagination.pageSize,
        skip: this.pagination.pageIndex * this.pagination.pageSize,
      })
      .then((tasks) => {
        runInAction(() => {
          this.isTasksLoading = false;
          this.total = tasks.total ?? 0;
          this.tasks = tasks.data ?? [];
        });
      });
  };

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
    if (this.collectionSlug) {
      this.loadTasks(this.collectionSlug, this.sourceType);
    }
  }

  updateTask = (task: TaskModel) => {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index > -1) {
      this.tasks[index] = task;
    }
  };
}
