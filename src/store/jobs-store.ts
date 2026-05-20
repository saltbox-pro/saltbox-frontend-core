import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { add_operation } from "json-logic-js";
import { action, makeObservable, observable, runInAction } from "mobx";
import { jsonLogicAdditionalOperators } from "react-querybuilder";

import {
  DEFAULT_JOB_DATE_RANGE_PRESET,
  getJobDateRangeForPreset,
  type JobDateRangePreset,
} from "saltbox-core/shared/constants/job-date-range-presets";
import { apiCoreStore, JobFilterStore } from "saltbox-core/store";

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
  @observable mongoDBQuery: object | undefined;
  @observable dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  @observable dateRangePreset: JobDateRangePreset;
  @observable jobFilterStore: JobFilterStore;

  constructor(jobFilterStore: JobFilterStore) {
    this.jobFilterStore = jobFilterStore;
    this.jobs = [];
    this.isInitialized = false;
    this.isJobsLoading = false;
    this.error = null;
    this.dateRange = [dayjs().add(-1, "hour"), dayjs()];
    this.dateRangePreset = DEFAULT_JOB_DATE_RANGE_PRESET;
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
    this.dateRange = [dayjs().add(-1, "hour"), dayjs()];
    this.dateRangePreset = DEFAULT_JOB_DATE_RANGE_PRESET;
    this.sorting = [...DEFAULT_SORTING];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  refreshJobs = () => {
    this.dateRange = getJobDateRangeForPreset(this.dateRangePreset);
    this.loadJobs();
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
      .catch((_) => {
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
  handleDateRangeChange = (range: [dayjs.Dayjs, dayjs.Dayjs], preset: JobDateRangePreset) => {
    this.dateRange = range;
    this.dateRangePreset = preset;
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
