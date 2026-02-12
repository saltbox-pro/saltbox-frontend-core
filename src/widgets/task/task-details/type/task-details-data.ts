import { TaskType } from "@saltbox/saltbox-core-api-client";

export type TaskDetailsData = {
  template: {
    title: string;
    saltFunction: string;
  };
  parameters: object | undefined;
  system: {
    taskType: TaskType;
    batchSize: number;
    maxParallelJobs: number;
    maxRetries: number;
    retryDelay: number;
  };
  target: {
    collection: string;
    minionIds?: string[];
    isQueryBased?: boolean;
    showMinionsDetails?: boolean;
  };
};
