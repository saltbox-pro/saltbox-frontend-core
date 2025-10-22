import { action, makeObservable, observable, runInAction } from 'mobx';
import { JobModel, JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from 'saltbox-core/store';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { toBackendSorting } from '@saltbox/saltbox-frontend-common';

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];
const PAGE_SIZE = 50;
export class JobStore {
  @observable jid: string;
  @observable job: JobModel | null;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable jobReturns: Array<JobReturnModel>;
  @observable isJobLoading: boolean;
  @observable isJobReturnsLoading: boolean;
  @observable error: string | null;
  @observable mongoDBQuery: object | undefined;

  constructor() {
    this.jid = '';
    this.isJobLoading = false;
    this.isJobReturnsLoading = false;
    this.job = null;
    this.jobReturns = [];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.sorting = [...DEFAULT_SORTING];
    this.mongoDBQuery = undefined;
    this.error = null;
    makeObservable(this);
  }

  @action
  reset = () => {
    this.jid = '';
    this.isJobLoading = false;
    this.isJobReturnsLoading = false;
    this.job = null;
    this.jobReturns = [];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.sorting = [...DEFAULT_SORTING];
    this.mongoDBQuery = undefined;
    this.error = null;
  };

  @action
  reload = (jid: string | undefined) => {
    this.jobReturns = [];
    this.jid = jid;
    if (this.jid) {
      this.loadJob();
    }
  };

  @action
  loadJob = () => {
    if (this.jid.length === 0) {
      return;
    }
    this.isJobLoading = true;
    this.error = null;
    apiCoreStore.jobsApi
      ?.jobRetrieve({ jid: this.jid as any })
      .then((job) => {
        if (!job) {
          runInAction(() => {
            this.error = 'Job not found';
          });
        } else {
          runInAction(() => {
            this.job = job;
          });
          this.loadJobReturns();
        }
      })
      .catch((error) => {
        console.error('Error loading job:', error);
        runInAction(() => {
          this.error = 'Failed to load job';
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isJobLoading = false;
        });
      });
  };

  @action
  loadJobReturns = (cursor: number | undefined = undefined) => {
    if (cursor === undefined) {
      this.jobReturns = [];
      this.isJobReturnsLoading = true;
    }
    apiCoreStore.jobsApi
      ?.jobReturnsList({
        JobListBody: {
          query: {
            jid: this.jid,
            ...this.mongoDBQuery,
          },
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        }
      })
      .then((jobReturns) => {
        runInAction(() => {
          this.jobReturns = jobReturns.data;
          this.total = jobReturns.total;
          this.isJobReturnsLoading = false;
        });
      });
  };

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadJobReturns();
  };

  @action
  addJobReturn = (jobReturn: JobReturnModel) => {
    const index = this.jobReturns.findIndex((jb) => jb.jid === jobReturn.jid);
    if (index > -1) {
      this.jobReturns[index] = jobReturn;
      this.jobReturns = [...this.jobReturns];
    } else if (this.pagination.pageIndex === 0 && jobReturn.jid === this.jid) {
      let newJobReturns = [jobReturn, ...this.jobReturns];
      if (newJobReturns.length > this.pagination.pageSize) {
        newJobReturns = newJobReturns.slice(0, this.pagination.pageSize);
      }
      this.jobReturns = newJobReturns;
      this.total++;
    }
  };

  @action
  addJobReturns = (jobReturns: JobReturnModel[]) => {
    jobReturns.map((jobReturn) => this.addJobReturn(jobReturn));
  };
}

export const jobStore = new JobStore();
