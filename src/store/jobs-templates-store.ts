import { JobSchemaShortSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class JobTemplateStore {
  jobsTemplate: Array<JobSchemaShortSchema>;
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  totalJobsTemplate: number;

  constructor() {
    makeAutoObservable(this);
    this.jobsTemplate = [];
    this.isLoading = false;
    this.totalJobsTemplate = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.loadJobsTemplate();
  }

  reload = () => {
    this.loadJobsTemplate();
  };

  loadJobsTemplate = () => {
    this.isLoading = true;
    apiCoreStore.jsonSchemasApi
      ?.jobsSchemasList({
        JobSchemaListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((data) => {
        runInAction(() => {
          this.jobsTemplate = data.data;
          this.totalJobsTemplate = data.total;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadJobsTemplate();
  }
}
