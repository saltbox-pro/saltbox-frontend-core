import { jsonLogicAdditionalOperators } from 'react-querybuilder';
import dayjs from 'dayjs';
import { add_operation, apply } from 'json-logic-js';
import { makeAutoObservable, runInAction } from 'mobx';
import { JobsListResponse } from "@saltbox/saltbox-core-api-client";
import {
  DATETIME_TIMESTAMP,
  formatTimeByUserTZ,
} from '@saltbox/saltbox-frontend-common';
import { apiCoreStore, JobFilterStore } from 'saltbox-core/store';

for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
  add_operation(op, func);
}

const PAGE_SIZE = 50;

export type JobStoreItem = JobsListResponse & {
  created?: string;
};

export class JobsStore {
  jobs: Array<JobStoreItem>;
  page: number;
  total: number;
  isJobsLoading: boolean;
  error: string | null;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  jobFilterStore: JobFilterStore;

  get filteredJobs(): Array<JobStoreItem> {
    return this.jobs.filter((job) =>
      apply(this.jobFilterStore.searchJsonLogicQuery, job),
    );
  }

  get hasMoreJobs(): boolean {
    return this.jobs.length < this.total;
  }

  get countLoadedJobs(): number {
    return this.jobs?.length ?? 0;
  }

  get countFilteredJobs(): number {
    return this.filteredJobs?.length ?? 0;
  }

  constructor(jobFilterStore: JobFilterStore) {
    makeAutoObservable(this);
    this.jobFilterStore = jobFilterStore;
    this.jobs = [];
    this.isJobsLoading = false;
    this.error = null;
    this.dateRange = [dayjs().startOf('day'), dayjs()];
    this.page = 0;
    this.total = 0;
  }

  loadJobs = (page: number) => {
    if (this.isJobsLoading) return;

    this.isJobsLoading = true;
    this.error = null;
    this.page = page;
    apiCoreStore.jobsApi
      ?.jobsList({
        start_datetime: this.dateRange[0].toDate(),
        end_datetime: this.dateRange[1].toDate(),
        limit: PAGE_SIZE,
        skip: this.page * PAGE_SIZE,
      })
      .then((response) => {
        runInAction(() => {
          this.isJobsLoading = false;
          this.total = response.total;
          response.data.forEach((job) => this.pushJob(job));
        });
      })
      .catch((error) => {
        runInAction(() => {
          this.isJobsLoading = false;
          this.error = "Failed to load jobs";
        });
      });
  };

  loadNextJobs = () => {
    if (this.page < this.total / PAGE_SIZE) {
      this.loadJobs(this.page + 1);
    }
  };

  newJobStoreItem(job: JobsListResponse): JobStoreItem {
    return {
      ...job,
      created: formatTimeByUserTZ(job.fms_jid_timestamp, DATETIME_TIMESTAMP),
    };
  }

  addJob = (job: JobsListResponse) => {
    const jobIndex = this.jobs.findIndex((j) => j.jid === job.jid);
    if (jobIndex > -1) {
      this.jobs[jobIndex] = this.newJobStoreItem(job);
    } else {
      this.jobs = [this.newJobStoreItem(job), ...this.jobs];
    }
  };

  pushJob = (job: JobsListResponse) => {
    const jobIndex = this.jobs.findIndex((j) => j.jid === job.jid);
    if (jobIndex > -1) {
      this.jobs[jobIndex] = this.newJobStoreItem(job);
    } else {
      this.jobs = [...this.jobs, this.newJobStoreItem(job)];
    }
  };

  resetJobs = () => {
    this.jobs = [];
    this.page = 0;
    this.total = 0;
    this.loadJobs(this.page);
  };

  handleDateRangeChange = (range: [dayjs.Dayjs, dayjs.Dayjs]) => {
    this.dateRange = range;
    this.resetJobs();
  };
}
