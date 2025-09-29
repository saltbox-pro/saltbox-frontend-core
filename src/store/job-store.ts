import { makeAutoObservable } from 'mobx';
import { JobModel, JobResult } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from 'saltbox-core/store';

export class JobStore {
  jid: string;
  job: JobModel | null;
  jobReturnsCount: number;
  jobReturns: Array<JobResult>;
  isJobLoading: boolean;
  isJobReturnsLoading: boolean;
  error: string | null;

  constructor() {
    makeAutoObservable(this);

    this.jid = '';
    this.isJobLoading = false;
    this.isJobReturnsLoading = false;
    this.job = null;
    this.jobReturns = [];
    this.jobReturnsCount = 0;
    this.error = null;
  }

  reload = (jid: string | undefined) => {
    this.jid = jid;
    if (this.jid) {
      this.loadJob();
    }
  };

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
          this.error = 'Job not found';
          return;
        }
        this.job = job;
        this.loadJobReturnsCount();
      })
      .catch((error) => {
        console.error('Error loading job:', error);
        this.error = 'Failed to load job';
      })
      .finally(() => {
        this.isJobLoading = false;
      });
  };

  loadJobReturnsCount = () => {
    apiCoreStore.jobsApi?.jobReturnsCount({ jid: this.jid as any }).then((val) => {
      this.jobReturnsCount = val;
      this.loadJobReturns();
    });
  };

  loadJobReturns = (cursor: number | undefined = undefined) => {
    if (cursor === undefined) {
      this.jobReturns = [];
      this.isJobReturnsLoading = true;
    }
    apiCoreStore.jobsApi
      ?.jobReturnsList({
        jid: this.jid as any,
        cursor,
      })
      .then((jobReturns) => {
        // fixed for <StrictMode> in dev
        if (DEVELOPMENT) {
          const filtredJobReturns = jobReturns.result.filter(
            (jobReturn) =>
              this.jobReturns.findIndex(
                (existsJobResult) => existsJobResult.id === jobReturn.id,
              ) === -1,
          );
          this.jobReturns = [...filtredJobReturns, ...this.jobReturns];
        } else {
          this.jobReturns = [...jobReturns.result, ...this.jobReturns];
        }
        if (jobReturns.cursor > 0) {
          this.loadJobReturns(jobReturns.cursor);
        } else {
          this.isJobReturnsLoading = false;
        }
      });
  };

  addJobReturn = (jobReturn: JobResult) => {
    const existingReturnIndex = this.jobReturns.findIndex(
      existingReturn => existingReturn.id === jobReturn.id
    );
    if (existingReturnIndex === -1) {
      this.jobReturns = [jobReturn, ...this.jobReturns];
    } else {
      this.jobReturns[existingReturnIndex] = jobReturn;
    }
  };
}

export const jobStore = new JobStore();
