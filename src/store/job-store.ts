import { action, makeObservable, observable, runInAction } from 'mobx';
import { JobModel, JobResult } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from 'saltbox-core/store';

export class JobStore {
  @observable jid: string;
  @observable job: JobModel | null;
  @observable jobReturnsCount: number;
  @observable jobReturns: Array<JobResult>;
  @observable isJobLoading: boolean;
  @observable isJobReturnsLoading: boolean;
  @observable error: string | null;

  constructor() {
    this.jid = '';
    this.isJobLoading = false;
    this.isJobReturnsLoading = false;
    this.job = null;
    this.jobReturns = [];
    this.jobReturnsCount = 0;
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
    this.jobReturnsCount = 0;
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
          this.loadJobReturnsCount();
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
  loadJobReturnsCount = () => {
    apiCoreStore.jobsApi?.jobReturnsCount({ jid: this.jid as any }).then((val) => {
      runInAction(() => {
        this.jobReturnsCount = val;
      });
      this.loadJobReturns();
    });
  };

  @action
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
        runInAction(() => {
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
        });
        if (jobReturns.cursor > 0) {
          this.loadJobReturns(jobReturns.cursor);
        } else {
          runInAction(() => {
            this.isJobReturnsLoading = false;
          });
        }
      });
  };

  @action
  addJobReturn = (jobReturn: JobResult) => {
    const index = this.jobReturns.findIndex((jb) => jb.id === jobReturn.id);
    if (index > -1) {
      this.jobReturns[index] = jobReturn;
    } else {
      this.jobReturns = [jobReturn, ...this.jobReturns];
    }
  };

  @action
  addJobReturns = (jobReturns: JobResult[]) => {
    jobReturns.map((jobReturn) => this.addJobReturn(jobReturn));
  };
}

export const jobStore = new JobStore();
