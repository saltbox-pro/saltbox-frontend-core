import { JobModel, JobReturnModel, JobStatus } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { getMaxExecutionTime } from "../shared/utils/execution-time-utils";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: false }];
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
    this.jid = "";
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
    this.jid = "";
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
            this.error = "Job not found";
          });
        } else {
          runInAction(() => {
            this.job = job;
          });
          this.loadJobReturns();
        }
      })
      .catch((error) => {
        console.error("Error loading job:", error);
        runInAction(() => {
          this.error = "Failed to load job";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isJobLoading = false;
        });
      });
  };

  @action
  loadJobReturns = (isSilentLoading: boolean = false) => {
    if (!isSilentLoading) {
      this.isJobReturnsLoading = true;
    }

    apiCoreStore.jobsApi
      ?.jobReturnsList({
        JobReturnsListBody: {
          query: {
            ...this.mongoDBQuery,
            ...(this.jid ? { jid: this?.jid } : {}),
          },
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((jobReturns) => {
        runInAction(() => {
          this.jobReturns = jobReturns.data;
          this.total = jobReturns.total;
        });
      })
      .catch((error) => {
        console.error("Error loading job returns:", error);
      })
      .finally(() => {
        if (!isSilentLoading) {
          runInAction(() => {
            this.isJobReturnsLoading = false;
          });
        }
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

  @action
  updateJob = (job: JobModel) => {
    if (new Date(this.job?.modified).getTime() < new Date(job?.modified).getTime()) {
      this.job = job;
    }
  };

  @action
  updateFromJobs = (jobs: JobModel[]) => {
    if (jobs.length === 0) return;
    const sortedJobs = jobs.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
    this.job = sortedJobs.at(0);
    this.loadJobReturns(true);
  };

  @computed
  get jobStartTimestamp() {
    const timestamp = this.job?.stamp || this.job?.created;
    if (!timestamp) return null;

    const date = dayjs(timestamp);
    if (!date.isValid()) {
      return null;
    }
    return date.toDate();
  }

  @computed
  get jobStartTime() {
    return this.jobStartTimestamp ? this.jobStartTimestamp.getTime() : null;
  }

  @computed
  get totalMinions() {
    return this.job?.minions_count?.total ?? 0;
  }

  @computed
  get progressPercent() {
    const c = this.jobReturnStatusCounts;
    const total = c.success + c.failed + c.timeout + c.ignored + c.waiting;
    if (total === 0) return 0;
    return ((c.success + c.failed + c.timeout + c.ignored) / total) * 100;
  }

  @computed
  get successPercent() {
    const c = this.jobReturnStatusCounts;
    const total = c.success + c.failed + c.timeout + c.ignored + c.waiting;
    if (total === 0) return 0;
    return (c.success / total) * 100;
  }

  @computed
  get isJobComplete() {
    const c = this.jobReturnStatusCounts;
    const total = c.success + c.failed + c.timeout + c.ignored + c.waiting;
    return this.job?.status === JobStatus.Finished || (total > 0 && c.waiting === 0);
  }

  @computed
  get actualJobDuration() {
    return getMaxExecutionTime(this.jobReturns, this.jobStartTime);
  }

  @computed
  get isSingleJobReturn() {
    return this.totalMinions === 1;
  }

  @computed
  get jobTargets() {
    if (Array.isArray(this.job?.tgt)) {
      return this.job.tgt.join(",");
    }
    if (typeof this.job?.tgt === "string") {
      return this.job.tgt.replace(/,\s+/g, ",");
    }
    return undefined;
  }

  @computed
  get jobReturnStatusCounts(): {
    total: number;
    waiting: number;
    success: number;
    failed: number;
    timeout: number;
    ignored: number;
  } {
    const mc = this.job?.minions_count;
    return {
      total: mc?.total ?? 0,
      waiting: mc?.waiting ?? 0,
      success: mc?.success ?? 0,
      failed: mc?.failed ?? 0,
      timeout: mc?.timeout ?? 0,
      ignored: mc?.ignored ?? 0,
    };
  }
}

export const jobStore = new JobStore();
