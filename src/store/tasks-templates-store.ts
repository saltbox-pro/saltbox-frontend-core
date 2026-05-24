import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

export class TaskTemplatesStore {
  taskTemplates: Array<TaskTemplateShortSchema>;
  isTaskTemplatesLoading: boolean;
  isSyncTaskTemplates: boolean;

  total: number;
  pagination: PaginationState;
  sorting: SortingState;

  constructor() {
    makeAutoObservable(this);

    this.taskTemplates = [];
    this.total = 0;
    this.isTaskTemplatesLoading = false;
    this.isSyncTaskTemplates = false;
    this.sorting = [];

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
        SaltboxCoreTasksSchemasTasksTemplateTaskTemplateListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((taskTemplates) => {
        runInAction(() => {
          this.isTaskTemplatesLoading = false;
          this.total = taskTemplates.total as number;
          this.taskTemplates = taskTemplates.data;
        });
      });
  };

  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadTaskTemplates();
  };
}

export const taskTemplatesStore = new TaskTemplatesStore();
