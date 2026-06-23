import { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

export type TaskTemplateSourceInfo = {
  name: string;
  repoUrl?: string | null;
};

export class TaskTemplatesStore {
  taskTemplates: Array<TaskTemplatePublicSchema>;
  sourceById = new Map<string, TaskTemplateSourceInfo>();
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

  getSourceInfo = (sourceId: string): TaskTemplateSourceInfo | undefined => {
    return this.sourceById.get(sourceId);
  };

  private loadSources = async () => {
    const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
      TemplateSourceListBody: { limit: 1000 },
    });

    const sourceById = new Map<string, TaskTemplateSourceInfo>();
    for (const source of response?.data ?? []) {
      sourceById.set(source.id, {
        name: source.name,
        repoUrl: source.repo_url,
      });
    }

    runInAction(() => {
      this.sourceById = sourceById;
    });
  };

  loadTaskTemplates = async () => {
    this.isTaskTemplatesLoading = true;

    try {
      const [taskTemplates, _] = await Promise.all([
        apiCoreStore.newTaskTemplatesApi?.newTemplateList({
          TaskTemplateListBody: {
            limit: this.pagination.pageSize,
            skip: this.pagination.pageIndex * this.pagination.pageSize,
            sort: toBackendSorting(this.sorting),
          },
        }),
        this.sourceById.size === 0 ? this.loadSources() : Promise.resolve(),
      ]);

      runInAction(() => {
        this.isTaskTemplatesLoading = false;
        this.total = taskTemplates?.total ?? 0;
        this.taskTemplates = taskTemplates?.data ?? [];
      });
    } catch {
      runInAction(() => {
        this.isTaskTemplatesLoading = false;
      });
    }
  };

  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadTaskTemplates();
  };
}

export const taskTemplatesStore = new TaskTemplatesStore();
