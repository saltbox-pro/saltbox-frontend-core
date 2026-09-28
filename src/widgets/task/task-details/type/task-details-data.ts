import type { TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import type { OptionList } from "react-querybuilder";

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
    ttlJobs?: number | null;
    ttlTask?: number | null;
  };
  target: {
    collection?: string;
    minionIds?: string[];
    isQueryBased?: boolean;
    userQuery?: object;
    userQueryFilterSchema?: OptionList;
    showMinionsDetails?: boolean;
  };
  pillars?: TaskModel["pillars"];
};
