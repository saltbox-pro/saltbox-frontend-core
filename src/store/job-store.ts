import { JobModel, JobReturnModel, JobStatus } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { getMaxExecutionTime } from "../shared/utils/execution-time-utils";

const DEFAULT_SORTING: SortingState = [{ id: "stamp", desc: true }];
const PAGE_SIZE = 50;

const isSameJob = (job: JobModel, other: JobModel): boolean =>
  job.jid === other.jid && job.salt_master === other.salt_master;

const restoreFieldsMissingInSocketJob = (currentJob: JobModel, socketJob: JobModel): JobModel => ({
  ...socketJob,
  template_id: socketJob.template_id ?? currentJob.template_id,
  template_source_id: socketJob.template_source_id ?? currentJob.template_source_id,
});

type FetchStatus = "idle" | "in-process" | "refetching" | "error" | "success";
type LoadingFetchStatus = Extract<FetchStatus, "in-process" | "refetching">;
type LoadJobReturnDataOptions = {
  force?: boolean;
  loadingStatus: LoadingFetchStatus;
};

export class JobStore {
  @observable jid: string;
  @observable job: JobModel | null;
  @observable total: number;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable jobReturns: Array<JobReturnModel>;
  @observable isJobLoading: boolean;
  @observable isJobReturnsLoading: boolean;
  @observable jobReturnDataById: Record<string, unknown>;
  @observable jobReturnDataStatusById: Record<string, FetchStatus>;
  @observable jobReturnDataErrorById: Record<
    string,
    null | "not-found" | "access-denied" | "load-failed" | "api-unavailable"
  >;
  @observable jobReturnTableColumns: string[];
  @observable jobReturnTableRows: Array<Record<string, unknown>>;
  @observable jobReturnTableTotal: number;
  @observable isJobReturnTableLoading: boolean;
  @observable jobReturnTableLoadError: boolean;
  @observable tablePagination: PaginationState;
  @observable error: string | null;
  @observable mongoDBQuery: object | undefined;

  private inFlightJobReturnDataLoads: Map<string, Promise<void>> = new Map();
  private staleJobReturnDataIds: Set<string> = new Set();
  private shouldLoadJobReturnsAfterStarting = false;

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
    this.jobReturnDataById = {};
    this.jobReturnDataStatusById = {};
    this.jobReturnDataErrorById = {};
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
    this.isJobReturnTableLoading = false;
    this.jobReturnTableLoadError = false;
    this.tablePagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
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
    this.jobReturnDataById = {};
    this.jobReturnDataStatusById = {};
    this.jobReturnDataErrorById = {};
    this.inFlightJobReturnDataLoads.clear();
    this.staleJobReturnDataIds.clear();
    this.shouldLoadJobReturnsAfterStarting = false;
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
    this.isJobReturnTableLoading = false;
    this.jobReturnTableLoadError = false;
    this.tablePagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.error = null;
  };

  @action
  prepareTableViewLoad = () => {
    this.jobReturnTableColumns = [];
    this.jobReturnTableRows = [];
    this.jobReturnTableTotal = 0;
    this.jobReturnTableLoadError = false;
    this.isJobReturnTableLoading = true;
  };

  @action
  beginJobReturnsReload = () => {
    this.isJobReturnsLoading = true;
  };

  @action
  private setJobReturnDataStatus = (jobReturnId: string, value: FetchStatus) => {
    this.jobReturnDataStatusById = { ...this.jobReturnDataStatusById, [jobReturnId]: value };
  };

  @action
  private setJobReturnDataError = (
    jobReturnId: string,
    value: null | "not-found" | "access-denied" | "load-failed" | "api-unavailable"
  ) => {
    this.jobReturnDataErrorById = { ...this.jobReturnDataErrorById, [jobReturnId]: value };
  };

  @action
  private setJobReturnData = (jobReturnId: string, data: unknown) => {
    this.jobReturnDataById = { ...this.jobReturnDataById, [jobReturnId]: data };
  };

  loadJobReturnData = async (
    jobReturnId: string,
    opts: LoadJobReturnDataOptions
  ): Promise<void> => {
    if (!jobReturnId) return;
    const shouldForceRefetch = this.staleJobReturnDataIds.has(jobReturnId);
    const hasCachedData = Object.prototype.hasOwnProperty.call(this.jobReturnDataById, jobReturnId);
    const force = Boolean(opts?.force);
    if (hasCachedData && !shouldForceRefetch && !force) return;

    const inFlight = this.inFlightJobReturnDataLoads.get(jobReturnId);
    if (inFlight) return await inFlight;

    const promise = (async () => {
      this.setJobReturnDataStatus(jobReturnId, opts.loadingStatus);
      this.setJobReturnDataError(jobReturnId, null);

      try {
        if (!apiCoreStore.jobsApi) {
          runInAction(() => {
            this.setJobReturnDataError(jobReturnId, "api-unavailable");
            this.setJobReturnDataStatus(jobReturnId, "error");
          });
          return;
        }

        const data = await apiCoreStore.jobsApi.jobReturnData({
          job_return_mongo_id: jobReturnId,
        });
        runInAction(() => {
          this.setJobReturnData(jobReturnId, data);
          this.setJobReturnDataStatus(jobReturnId, "success");
          this.staleJobReturnDataIds.delete(jobReturnId);
        });
      } catch (e) {
        console.error("loadJobReturnData:", e);
        const status = (e as { response?: { status?: number } })?.response?.status;
        runInAction(() => {
          if (status === 404) this.setJobReturnDataError(jobReturnId, "not-found");
          else if (status === 403) this.setJobReturnDataError(jobReturnId, "access-denied");
          else this.setJobReturnDataError(jobReturnId, "load-failed");
          this.setJobReturnDataStatus(jobReturnId, "error");
        });
      } finally {
        this.inFlightJobReturnDataLoads.delete(jobReturnId);
      }
    })();

    this.inFlightJobReturnDataLoads.set(jobReturnId, promise);
    return await promise;
  };

  isJobReturnDataStale = (jobReturnId: string): boolean => {
    if (!jobReturnId) return false;
    return this.staleJobReturnDataIds.has(jobReturnId);
  };

  getJobReturnDataStatus = (jobReturnId: string): FetchStatus =>
    this.jobReturnDataStatusById[jobReturnId] ?? "idle";

  getJobReturnDataError = (
    jobReturnId: string
  ): null | "not-found" | "access-denied" | "load-failed" | "api-unavailable" =>
    this.jobReturnDataErrorById[jobReturnId] ?? null;

  getJobReturn = (jobReturnId: string): JobReturnModel | undefined =>
    this.jobReturns.find((r) => r.id === jobReturnId);

  getJobReturnData = (jobReturnId: string): unknown => this.jobReturnDataById[jobReturnId];

  @action
  invalidateJobReturnData = (jobReturnId: string) => {
    if (!jobReturnId) return;
    const { [jobReturnId]: _data, ...nextData } = this.jobReturnDataById;
    const { [jobReturnId]: _status, ...nextStatus } = this.jobReturnDataStatusById;
    const { [jobReturnId]: _error, ...nextError } = this.jobReturnDataErrorById;
    this.jobReturnDataById = nextData;
    this.jobReturnDataStatusById = nextStatus;
    this.jobReturnDataErrorById = nextError;
    this.inFlightJobReturnDataLoads.delete(jobReturnId);
  };

  @action
  mergeJobReturnsFromSocket = (incoming: JobReturnModel[]) => {
    if (!this.jid || incoming.length === 0) return;

    const next = [...this.jobReturns];
    let changed = false;

    const currentSaltMaster = this.job?.salt_master;

    for (const jobReturn of incoming) {
      if (!jobReturn?.id || jobReturn.jid !== this.jid) continue;
      if (currentSaltMaster && jobReturn.salt_master !== currentSaltMaster) continue;
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
  reload = (jid: string | undefined) => {
    this.jobReturns = [];
    this.jid = jid;
    this.shouldLoadJobReturnsAfterStarting = false;
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
      ?.jobRetrieve({ jid: this.jid })
      .then((job) => {
        if (!job) {
          runInAction(() => {
            this.error = "Job not found";
          });
        } else {
          runInAction(() => {
            this.job = job;
          });
          if (job.status === JobStatus.Starting) {
            this.shouldLoadJobReturnsAfterStarting = true;
          } else {
            this.loadJobReturns();
          }
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
  loadJobReturns = (isSilentLoading: boolean = false): Promise<void> => {
    if (this.jid && this.job?.status === JobStatus.Starting) {
      this.shouldLoadJobReturnsAfterStarting = true;
      return Promise.resolve();
    }

    this.shouldLoadJobReturnsAfterStarting = false;
    if (!isSilentLoading) {
      this.isJobReturnsLoading = true;
    }

    return (
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
        }) ?? Promise.resolve()
    );
  };

  @action
  loadJobReturnsTable = (): Promise<void> => {
    if (this.jid && this.job?.status === JobStatus.Starting) {
      this.isJobReturnTableLoading = false;
      return Promise.resolve();
    }

    this.isJobReturnTableLoading = true;
    this.jobReturnTableLoadError = false;

    return (
      apiCoreStore.jobsApi
        ?.jobReturnsTable({
          JobReturnsListBody: {
            query: {
              ...this.mongoDBQuery,
              ...(this.jid ? { jid: this.jid } : {}),
            },
            limit: this.tablePagination.pageSize,
            skip: this.tablePagination.pageIndex * this.tablePagination.pageSize,
          },
        })
        .then((response) => {
          runInAction(() => {
            this.jobReturnTableColumns = response.columns;
            this.jobReturnTableRows = (response.data ?? []).filter(
              (row): row is Record<string, unknown> => row != null
            );
            this.jobReturnTableTotal = response.total;
            this.jobReturnTableLoadError = false;
          });
        })
        .catch((error) => {
          console.error("Error loading job returns table:", error);
          runInAction(() => {
            this.jobReturnTableLoadError = true;
          });
        })
        .finally(() => {
          runInAction(() => {
            this.isJobReturnTableLoading = false;
          });
        }) ?? Promise.resolve()
    );
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
