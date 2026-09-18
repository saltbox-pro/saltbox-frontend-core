import { JobModel, JobReturnModel, JobStatus } from "@saltbox/saltbox-core-api-client";
import {
  createKeyedLoader,
  createLoader,
  type LoadSource,
  toBackendSorting,
} from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { getMaxExecutionTime } from "../shared/utils/execution-time-utils";
import { isJobTtlEditable } from "../shared/utils/job-ttl-utils";

const DEFAULT_SORTING: SortingState = [{ id: "stamp", desc: true }];
const PAGE_SIZE = 50;

const isSameJob = (job: JobModel, other: JobModel): boolean => job.id === other.id;

const restoreFieldsMissingInSocketJob = (currentJob: JobModel, socketJob: JobModel): JobModel => ({
  ...socketJob,
  template_id: socketJob.template_id ?? currentJob.template_id,
  template_source_id: socketJob.template_source_id ?? currentJob.template_source_id,
});

export class JobStore {
  @observable jobId: string;
  @observable job: JobModel | null;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable jobReturns: Array<JobReturnModel>;
  @observable jobReturnDataById: Record<string, unknown>;
  @observable jobReturnTableColumns: string[];
  @observable jobReturnTableRows: Array<Record<string, unknown>>;
  @observable jobReturnTableTotal: number;
  @observable tablePagination: PaginationState;
  @observable mongoDBQuery: object | undefined;

  private staleJobReturnDataIds: Set<string> = new Set();
  private shouldLoadJobReturnsAfterStarting = false;
  private readonly initialSorting: SortingState;
  private minionId: string | null = null;
  private saltMaster: string | null = null;

  readonly jobLoad = createLoader({
    run: () => (this.jobId ? apiCoreStore.jobsApi?.jobRetrieve({ job_id: this.jobId }) : undefined),
    onSuccess: (job) => {
      this.job = job;
      if (job.status === JobStatus.Starting) {
        this.shouldLoadJobReturnsAfterStarting = true;
      } else {
        this.loadJobReturns();
      }
    },
  });

  readonly jobReturnsLoad = createLoader({
    run: () =>
      apiCoreStore.jobsApi?.jobReturnsList({
        JobReturnsListBody: {
          query: this.getJobReturnsListQuery(),
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      }),
    onSuccess: (jobReturns) => {
      this.jobReturns = jobReturns.data;
      this.total = jobReturns.total;
    },
  });

  readonly jobReturnsTableLoad = createLoader({
    run: () =>
      apiCoreStore.jobsApi?.jobReturnsTable({
        JobReturnsListBody: {
          query: this.getJobReturnsListQuery(),
          limit: this.tablePagination.pageSize,
          skip: this.tablePagination.pageIndex * this.tablePagination.pageSize,
        },
      }),
    onSuccess: (response) => {
      this.jobReturnTableColumns = response.columns;
      this.jobReturnTableRows = (response.data ?? []).filter(
        (row): row is Record<string, unknown> => row != null
      );
      this.jobReturnTableTotal = response.total;
    },
  });

  readonly jobReturnDataLoad = createKeyedLoader({
    run: (jobReturnId: string) =>
      apiCoreStore.jobsApi?.jobReturnData({ job_return_mongo_id: jobReturnId }),
    onSuccess: (data, jobReturnId) => {
      this.jobReturnDataById = { ...this.jobReturnDataById, [jobReturnId]: data };
      this.staleJobReturnDataIds.delete(jobReturnId);
    },
  });

  constructor(initialSorting: SortingState = DEFAULT_SORTING) {
    this.initialSorting = [...initialSorting];
    this.jobId = "";
    this.job = null;
    this.jobReturns = [];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.sorting = [...this.initialSorting];
    this.mongoDBQuery = undefined;
    this.jobReturnDataById = {};
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
    this.tablePagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    makeObservable(this);
  }

  @computed get isJobLoading(): boolean {
    return this.jobLoad.isLoading;
  }

  @computed get isJobReturnsLoading(): boolean {
    return this.jobReturnsLoad.isLoading;
  }

  @computed get isJobReturnTableLoading(): boolean {
    return this.jobReturnsTableLoad.isLoading;
  }

  @action
  reset = () => {
    this.jobId = "";
    this.job = null;
    this.jobReturns = [];
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.sorting = [...this.initialSorting];
    this.mongoDBQuery = undefined;
    this.minionId = null;
    this.saltMaster = null;
    this.jobReturnDataById = {};
    this.staleJobReturnDataIds.clear();
    this.shouldLoadJobReturnsAfterStarting = false;
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
    this.tablePagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  setMinionContext = (minionId: string | null, saltMaster: string | null) => {
    this.minionId = minionId;
    this.saltMaster = saltMaster;
  };

  private getJobReturnsListQuery = (): object => ({
    ...(this.mongoDBQuery ?? {}),
    ...(this.jobId ? { job_id: this.jobId } : {}),
    ...(this.minionId ? { minion_id: this.minionId } : {}),
    ...(this.saltMaster ? { salt_master: this.saltMaster } : {}),
  });

  @action
  prepareTableViewLoad = () => {
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
  };

  loadJobReturnData = (jobReturnId: string, opts?: { force?: boolean }): Promise<void> => {
    if (!jobReturnId) return Promise.resolve();

    const shouldForceRefetch = this.staleJobReturnDataIds.has(jobReturnId);
    const hasCachedData = Object.prototype.hasOwnProperty.call(this.jobReturnDataById, jobReturnId);
    if (hasCachedData && !shouldForceRefetch && !opts?.force) return Promise.resolve();

    return this.jobReturnDataLoad.run(jobReturnId);
  };

  getJobReturnDataState = (jobReturnId: string): LoadSource =>
    this.jobReturnDataLoad.state(jobReturnId);

  isJobReturnDataStale = (jobReturnId: string): boolean => {
    if (!jobReturnId) return false;
    return this.staleJobReturnDataIds.has(jobReturnId);
  };

  getJobReturn = (jobReturnId: string): JobReturnModel | undefined =>
    this.jobReturns.find((r) => r.id === jobReturnId);

  getJobReturnData = (jobReturnId: string): unknown => this.jobReturnDataById[jobReturnId];

  @action
  invalidateJobReturnData = (jobReturnId: string) => {
    if (!jobReturnId) return;
    const { [jobReturnId]: _data, ...nextData } = this.jobReturnDataById;
    this.jobReturnDataById = nextData;
  };

  @action
  mergeJobReturnsFromSocket = (incoming: JobReturnModel[]) => {
    if (!this.jobId || incoming.length === 0) return;

    const next = [...this.jobReturns];
    let changed = false;

    for (const jobReturn of incoming) {
      if (!jobReturn?.id || jobReturn.job_id !== this.jobId) continue;
      const idx = next.findIndex((r) => r.id === jobReturn.id);
      if (idx !== -1) {
        const prev = next[idx];
        const prevStatus = prev?.status;
        const nextStatus = jobReturn?.status;

        next[idx] = jobReturn;
        changed = true;

        const statusChanged = prevStatus !== nextStatus;
        if (statusChanged) {
          this.staleJobReturnDataIds.add(jobReturn.id);
          this.invalidateJobReturnData(jobReturn.id);
        }
      }
    }

    if (!changed) return;

    this.jobReturns = next;
  };

  @action
  reload = (jobId: string | undefined) => {
    this.jobReturns = [];
    this.jobId = jobId;
    this.minionId = null;
    this.saltMaster = null;
    this.shouldLoadJobReturnsAfterStarting = false;
    if (this.jobId) {
      this.loadJob();
    }
  };

  loadJob = () => {
    if (this.jobId.length === 0) {
      return;
    }
    this.jobLoad.run().catch(() => undefined);
  };

  @action
  loadJobReturns = (): Promise<void> => {
    if (this.jobId && this.job?.status === JobStatus.Starting) {
      this.shouldLoadJobReturnsAfterStarting = true;
      return Promise.resolve();
    }

    this.shouldLoadJobReturnsAfterStarting = false;

    return this.jobReturnsLoad.run();
  };

  loadJobReturnsTable = (): Promise<void> => {
    if (this.jobId && this.job?.status === JobStatus.Starting) {
      return Promise.resolve();
    }

    return this.jobReturnsTableLoad.run();
  };

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
    this.loadJobReturns();
  };

  @action
  handleTableLazyLoad = (pagination: PaginationState) => {
    this.tablePagination = pagination;
    this.loadJobReturnsTable();
  };

  @action
  addJobReturn = (jobReturn: JobReturnModel) => {
    const index = this.jobReturns.findIndex((jb) => jb.id === jobReturn.id);
    if (index > -1) {
      this.jobReturns[index] = jobReturn;
      this.jobReturns = [...this.jobReturns];
    } else if (this.pagination.pageIndex === 0 && jobReturn.job_id === this.jobId) {
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
  updateFromJobs = (jobs: JobModel[]) => {
    if (jobs.length === 0) return;

    const currentJob = this.job;
    const relevantJobs = currentJob ? jobs.filter((job) => isSameJob(job, currentJob)) : jobs;

    if (relevantJobs.length === 0) return;

    const latestJob = [...relevantJobs].sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    )[0];

    this.job = currentJob ? restoreFieldsMissingInSocketJob(currentJob, latestJob) : latestJob;

    if (this.shouldLoadJobReturnsAfterStarting && this.job?.status !== JobStatus.Starting) {
      this.shouldLoadJobReturnsAfterStarting = false;
      this.loadJobReturns();
    }
  };

  /** Локально применяем новый TTL команды, не дожидаясь подтверждения по сокету. */
  @action
  applyJobTtl = (ttl: number | null, waitingExpiresAt?: Date | null) => {
    if (!this.job) return;

    this.job = {
      ...this.job,
      ttl: ttl ?? undefined,
      ...(waitingExpiresAt ? { waiting_expires_at_dt: waitingExpiresAt } : {}),
    };
  };

  /** ttl === null снимает персональный оверрайд, возвращая клиента под TTL команды. */
  @action
  applyJobReturnsTtl = (minionIds: string[], ttl: number | null) => {
    if (minionIds.length === 0) return;

    const targets = new Set(minionIds);
    let changed = false;

    const next = this.jobReturns.map((jobReturn) => {
      if (!targets.has(jobReturn.minion_id)) return jobReturn;
      changed = true;
      return { ...jobReturn, ttl };
    });

    if (changed) {
      this.jobReturns = next;
    }
  };

  @computed
  get jobMinions(): string[] {
    return (this.job?.minions ?? []).filter((minion): minion is string => !!minion);
  }

  @computed
  get isJobTtlEditable(): boolean {
    return isJobTtlEditable(this.job);
  }

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
  get jobTargetsText(): string {
    if (Array.isArray(this.job?.tgt)) {
      return this.job.tgt.filter(Boolean).join(",");
    }
    return typeof this.job?.tgt === "string" ? this.job.tgt : "";
  }

  @computed
  get isLaunchError() {
    return this.job?.status === JobStatus.LaunchError;
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
