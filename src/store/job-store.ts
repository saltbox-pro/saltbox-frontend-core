import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import dayjs from 'dayjs';
import { JobModel, JobReturnModel, JobStatus } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from 'saltbox-core/store';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { toBackendSorting } from '@saltbox/saltbox-frontend-common';
import { getMaxExecutionTime } from '../shared/utils/execution-time-utils';

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
  loadJobReturns = (isSilentLoading: boolean = false) => {
    if (!isSilentLoading) {
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
          if (!isSilentLoading) {
            this.isJobReturnsLoading = false;
          }
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

  @action
  updateJob = (job: JobModel) => {
    this.job = job;
  }

  @action
  updateFromJobs = (jobs: JobModel[]) => {
    const sortedJobs = jobs.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    this.job = sortedJobs.at(0);
    this.loadJobReturns(true);
  }

  @computed
  get successfulMinions() {
    return Object.keys(this.job?.returning)?.filter((minion) => this.job?.returning[minion] === true)?.length ?? 0;
  }

  @computed
  get successfulMinionsList() {
    return this.job?.minions?.filter((minion) => this.job?.returning[minion] === true) ?? [];
  }

  @computed
  get failedMinions() {
    const minions = Object.keys(this.job?.returning);
    return minions?.filter((minion) => this.job?.returning[minion] === false)?.length ?? 0;
  }

  @computed
  get failedMinionsList() {
    return this.job?.minions?.filter((minion) => this.job?.returning[minion] === false) ?? [];
  }

  @computed
  get pendingMinions() {
    const totalMinions = this.job?.minions?.length ?? 0;
    return totalMinions - this.successfulMinions - this.failedMinions;
  }

  @computed
  get pendingMinionsList() {
    return this.job?.minions?.filter((minion) => !this.job?.returning[minion]) ?? [];
  }

  @computed
  get jobStartTimestamp() {
    let timestamp = null;
    if (this.job?.fms_jid_timestamp) {
      timestamp = this.job.fms_jid_timestamp;
    } else if (this.job?.created) {
      timestamp = this.job.created;
    } else return null;

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
  get progressPercent() {
    return this.totalMinions > 0 ? ((this.failedMinions + this.successfulMinions) / this.totalMinions) * 100 : 0;
  }

  @computed
  get successPercent() {
    return this.totalMinions > 0 ? (this.successfulMinions / this.totalMinions) * 100 : 0;
  }

  @computed
  get totalMinions() {
    return this.job?.minions?.length ?? 0;
  }

  @computed
  get isJobComplete() {
    return this.job?.status === JobStatus.Finished ||
      (this.totalMinions > 0 && this.pendingMinions === 0);
  }

  @computed
  get actualJobDuration() {
    return getMaxExecutionTime(this.jobReturns, this.jobStartTime);
  }

  @computed
  get isSingleJobReturn() {
    return Math.max(this.totalMinions, this.total) === 1;
  }
}

export const jobStore = new JobStore();
