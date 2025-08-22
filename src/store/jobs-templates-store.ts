import { PaginationState } from '@tanstack/react-table';
import { makeAutoObservable, runInAction } from 'mobx';
import { JobSchemaShortSchema } from "@saltbox/saltbox-core-api-client";
import { apiStore } from './api-store';

export class JobTemplateStore {
  jobsTemplate: Array<JobSchemaShortSchema>;
  isLoading: boolean;
  pagination: PaginationState;
  totalJobsTemplate: number;

  constructor() {
    makeAutoObservable(this);
    this.jobsTemplate = [];
    this.isLoading = false;
    this.totalJobsTemplate = 0;
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
    apiStore.jsonSchemasApi
      ?.getJsonSchemasListJsonSchemasGet({
        limit: this.pagination.pageSize,
        skip: this.pagination.pageIndex * this.pagination.pageSize,
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

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
    this.loadJobsTemplate();
  }
}
