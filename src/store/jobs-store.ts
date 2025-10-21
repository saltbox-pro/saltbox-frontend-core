import { jsonLogicAdditionalOperators } from 'react-querybuilder';
import dayjs from 'dayjs';
import { add_operation, apply } from 'json-logic-js';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import {
  DATETIME_TIMESTAMP,
  formatTimeByUserTZ,
  toBackendSorting,
} from '@saltbox/saltbox-frontend-common';
import { apiCoreStore, JobFilterStore } from 'saltbox-core/store';
import { PaginationState, SortingState } from '@tanstack/react-table';

for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
  add_operation(op, func);
}

const PAGE_SIZE = 50;

export type JobStoreItem = JobsListResponse & {
  created?: string;
};

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class JobsStore {
  @observable jobs: Array<JobStoreItem>;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable isInitialized: boolean;
  @observable isJobsLoading: boolean;
  @observable error: string | null;
  @observable dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  @observable jobFilterStore: JobFilterStore;

  @computed
  get filteredJobs(): Array<JobStoreItem> {
    return this.jobs.filter((job) =>
      apply(this.jobFilterStore.searchJsonLogicQuery, job),
    );
  }

  @computed
  get hasMoreJobs(): boolean {
    return this.jobs.length < this.total;
  }

  @computed
  get countLoadedJobs(): number {
    return this.jobs?.length ?? 0;
  }

  @computed
  get countFilteredJobs(): number {
    return this.filteredJobs?.length ?? 0;
  }

  constructor(jobFilterStore: JobFilterStore) {
    this.jobFilterStore = jobFilterStore;
    this.jobs = [];
    this.isInitialized = false;
    this.isJobsLoading = false;
    this.error = null;
    this.dateRange = [dayjs().startOf('day'), dayjs()];
    this.sorting = [...DEFAULT_SORTING];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    makeObservable(this);
  }

  @action
  resetJobs = () => {
    this.jobs = [];
    this.isInitialized = false;
    this.isJobsLoading = false;
    this.error = null;
    this.dateRange = [dayjs().startOf('day'), dayjs()];
    this.sorting = [...DEFAULT_SORTING];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  loadJobs = () => {
    if (this.isJobsLoading) return;

    this.isJobsLoading = true;
    this.error = null;
    apiCoreStore.jobsApi
      ?.jobsList({
        start_datetime: this.dateRange[0].toDate(),
        end_datetime: this.dateRange[1].toDate(),
        limit: this.pagination.pageSize,
        skip: this.pagination.pageIndex * this.pagination.pageSize,
      })
      .then((response) => {
        runInAction(() => {
          this.isInitialized = true;
          this.isJobsLoading = false;
          this.total = response?.total ?? 0;
          this.jobs = response?.data ?? [];
        });
      })
      .catch((error) => {
        runInAction(() => {
          this.isInitialized = true;
          this.isJobsLoading = false;
          this.error = "Failed to load jobs";
        });
      });
  };

  @action handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadJobs();
  };

  @action updateJob = (job: JobsListResponse) => {
    const index = this.jobs.findIndex((item) => item.jid === job.jid);
    if (index > -1) {
      this.jobs[index] = job;
      this.jobs = [...this.jobs];
    } else if (this.pagination.pageIndex === 0) {
      let newJobs = [job, ...this.jobs];
      if (newJobs.length > this.pagination.pageSize) {
        newJobs = newJobs.slice(0, this.pagination.pageSize);
      }
      this.jobs = newJobs;
      this.total++;
    }
  };

  @action updateJobs = (jobs: JobsListResponse[]) => {
    jobs.map((job) => this.updateJob(job));
  };

  @action
  handleDateRangeChange = (range: [dayjs.Dayjs, dayjs.Dayjs]) => {
    this.dateRange = range;
    this.resetJobs();
    this.loadJobs();
  };
}
