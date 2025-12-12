import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { PaginationState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

export class TaskTemplatesStore {
  taskTemplates: Array<TaskTemplateShortSchema>;
  isTaskTemplatesLoading: boolean;
  isSyncTaskTemplates: boolean;

  total: number;
  pagination: PaginationState;

  constructor() {
    makeAutoObservable(this);

    this.taskTemplates = [];
    this.total = 0;
    this.isTaskTemplatesLoading = false;
    this.isSyncTaskTemplates = false;

    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  reload = () => {
    this.loadTaskTemplates();
  };

  loadTaskTemplates = () => {
    this.isTaskTemplatesLoading = true;
    apiCoreStore.taskTemplatesApi
      ?.taskTemplatesList({
        limit: this.pagination.pageSize,
        skip: this.pagination.pageIndex * this.pagination.pageSize,
      })
      .then((taskTemplates) => {
        runInAction(() => {
          this.isTaskTemplatesLoading = false;
          this.total = taskTemplates.total as number;
          this.taskTemplates = taskTemplates.data;
        });
      });
  };

  handleLazyLoad = (pagination: PaginationState) => {
    this.pagination = pagination;
    this.loadTaskTemplates();
  };
}

export const taskTemplatesStore = new TaskTemplatesStore();
