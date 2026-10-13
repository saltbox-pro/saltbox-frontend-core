import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import {
  applyFilterByValue,
  createLoader,
  hasFilterByValue,
  toBackendSorting,
} from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { add_operation } from "json-logic-js";
import { action, computed, makeObservable, observable } from "mobx";
import { jsonLogicAdditionalOperators } from "react-querybuilder";

import {
  DEFAULT_JOB_DATE_RANGE_PRESET,
  getJobDateRangeForPreset,
  JOB_DATE_RANGE_PRESET,
  type JobDateRangePreset,
} from "saltbox-core/shared/constants/job-date-range-presets";
import { buildJobsListQuery } from "saltbox-core/shared/utils/build-jobs-list-query";
import { hasJobCreatedFilterField } from "saltbox-core/shared/utils/job-filter-fields";
import { apiCoreStore, JobFilterStore } from "saltbox-core/store";

for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
  add_operation(op, func);
}

const PAGE_SIZE = 50;

export type JobStoreItem = JobsListResponse & {
  created?: string;
};

export interface JobsStoreOptions {
  saltMaster?: string;
}

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class JobsStore {
  @observable jobs: Array<JobStoreItem>;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable mongoDBQuery: object | undefined;
  @observable createdSince: dayjs.Dayjs | null;
  @observable dateRangePreset: JobDateRangePreset;
  @observable jobFilterStore: JobFilterStore;
  @observable appliedFiltersHadCreated: boolean;
  readonly saltMaster: string | undefined;

  readonly jobsLoad = createLoader({
    run: () =>
      apiCoreStore.jobsApi?.jobsList({
        JobListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          query: {
            ...buildJobsListQuery(this.createdSince, this.mongoDBQuery),
            ...(this.saltMaster ? { salt_master: this.saltMaster } : {}),
          },
        },
      }),
    onSuccess: (response) => {
      this.total = response?.total ?? 0;
      this.jobs = response?.data ?? [];
    },
  });

  constructor(jobFilterStore: JobFilterStore, options?: JobsStoreOptions) {
    this.jobFilterStore = jobFilterStore;
    this.saltMaster = options?.saltMaster;
    this.jobs = [];
    this.createdSince = getJobDateRangeForPreset(DEFAULT_JOB_DATE_RANGE_PRESET);
    this.dateRangePreset = DEFAULT_JOB_DATE_RANGE_PRESET;
    this.appliedFiltersHadCreated = false;
    this.sorting = [...DEFAULT_SORTING];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    makeObservable(this);
  }

  @computed get isJobsLoading(): boolean {
    return this.jobsLoad.isLoading;
  }

  @action
  resetJobs = () => {
    this.jobs = [];
    this.createdSince = getJobDateRangeForPreset(DEFAULT_JOB_DATE_RANGE_PRESET);
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
    this.createdSince = getJobDateRangeForPreset(this.dateRangePreset);
    this.loadJobs();
  };

  loadJobs = () => {
    if (this.jobsLoad.isLoading) {
      return;
    }
    this.jobsLoad.run().catch(() => undefined);
  };

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadJobs();
  };

  @action
  resetDateRangeToAllTime = () => {
    this.dateRangePreset = JOB_DATE_RANGE_PRESET.ALL_TIME;
    this.createdSince = null;
  };

  @action
  resetDateRangeToDefault = () => {
    this.dateRangePreset = DEFAULT_JOB_DATE_RANGE_PRESET;
    this.createdSince = getJobDateRangeForPreset(DEFAULT_JOB_DATE_RANGE_PRESET);
  };

  @action
  syncDateRangeWithAppliedFilters = () => {
    const hasCreated = hasJobCreatedFilterField(this.jobFilterStore.searchFilters);

    if (hasCreated && !this.appliedFiltersHadCreated) {
      this.resetDateRangeToAllTime();
    } else if (!hasCreated && this.appliedFiltersHadCreated) {
      this.resetDateRangeToDefault();
    }

    this.appliedFiltersHadCreated = hasCreated;
  };

  @action
  handleDateRangeChange = (createdSince: dayjs.Dayjs | null, preset: JobDateRangePreset) => {
    this.createdSince = createdSince;
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

  hasCellFilter = (fieldName: string, value: unknown): boolean => {
    return hasFilterByValue(this.jobFilterStore, fieldName, toJobCellFilterValue(value));
  };

  @action
  applyCellFilter = (fieldName: string, value: unknown): "added" | "removed" | "unsupported" => {
    const next = applyFilterByValue(this.jobFilterStore, fieldName, toJobCellFilterValue(value), {
      search: true,
      mode: "flatten-field",
    });
    if (!next.ok) {
      return "unsupported";
    }

    this.syncDateRangeWithAppliedFilters();
    this.mongoDBQuery = this.jobFilterStore.searchMongoDBQuery;
    this.handleSearch();

    return next.result;
  };
}

function toJobCellFilterValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? ""));
  }

  if (value == null) {
    return "";
  }

  return String(value);
}
