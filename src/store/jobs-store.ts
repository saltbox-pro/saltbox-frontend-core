import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { add_operation } from "json-logic-js";
import { action, makeObservable, observable, runInAction } from "mobx";
import { jsonLogicAdditionalOperators } from "react-querybuilder";

import { apiCoreStore, JobFilterStore } from "saltbox-core/store";

for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
  add_operation(op, func);
}

const PAGE_SIZE = 50;

export type JobStoreItem = JobsListResponse & {
  created?: string;
};

const DEFAULT_SORTING: SortingState = [{ id: "fms_jid_timestamp", desc: true }];

export class JobsStore {
  @observable jobs: Array<JobStoreItem>;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable isInitialized: boolean;
  @observable isJobsLoading: boolean;
  @observable error: string | null;
  @observable mongoDBQuery: object | undefined;
  @observable dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  @observable jobFilterStore: JobFilterStore;

  constructor(jobFilterStore: JobFilterStore) {
    this.jobFilterStore = jobFilterStore;
    this.jobs = [];
    this.isInitialized = false;
    this.isJobsLoading = false;
    this.error = null;
    this.dateRange = [dayjs().startOf("day"), dayjs()];
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
    this.dateRange = [dayjs().startOf("day"), dayjs()];
    this.sorting = [...DEFAULT_SORTING];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  loadJobs = () => {
    if (this.isJobsLoading) {
      return;
    }
    this.isJobsLoading = true;
    this.error = null;
    apiCoreStore.jobsApi
      ?.jobsList({
        JobListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          query: {
            created: {
              $gte: this.dateRange[0].toDate(),
              $lte: this.dateRange[1].toDate(),
            },
            ...this.mongoDBQuery,
          },
        },
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

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadJobs();
  };

  @action
  updateJob = (job: JobsListResponse) => {
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

  @action
  updateJobs = (jobs: JobsListResponse[]) => {
    const sortedJobs = jobs.sort(
      (a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime()
    );
    sortedJobs.map((job) => this.updateJob(job));
  };

  @action
  handleDateRangeChange = (range: [dayjs.Dayjs, dayjs.Dayjs]) => {
    this.dateRange = range;
    this.pagination.pageIndex = 0;
    this.loadJobs();
  };

  @action
  handleSearch = () => {
    this.pagination.pageIndex = 0;
    this.loadJobs();
  };

  @action
  handleReset = () => {
    this.jobFilterStore.handleResetFilters();
    this.pagination.pageIndex = 0;
    this.loadJobs();
  };
}
