import { PaginationState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";
import { TaskListResponseSchema, TaskModel } from "@api/index";
import { apiStore } from "@store/api-store";

export class TasksStore {
  tasks: Array<TaskListResponseSchema>;
  isTasksLoading: boolean;
  collectionSlug: string | null;

  total: number;
  pagination: PaginationState;

  constructor() {
    makeAutoObservable(this);

    this.tasks = [];
    this.total = 0;
    this.isTasksLoading = false;
    this.collectionSlug = null;

    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  loadTasks = (collectionSlug?: string) => {
    if (!collectionSlug) return;
    this.collectionSlug = collectionSlug;
    this.isTasksLoading = true;
    apiStore.tasksApi
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
      this.loadTasks(this.collectionSlug);
    }
  }

  updateTask = (task: TaskModel) => {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index > -1) {
      this.tasks[index] = task;
    }
  };
}
