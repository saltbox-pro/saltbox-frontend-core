import type { TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import type { OptionList } from "react-querybuilder";

import type { DurationDisplay } from "saltbox-core/shared/utils/duration-display";

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
    retryDelay?: DurationDisplay | null;
    ttlJobs?: DurationDisplay | null;
    ttlTask?: DurationDisplay | null;
  };
  target: {
    collection?: string;
    minionIds?: string[];
    isQueryBased?: boolean;
    userQuery?: object;
    userQueryFilterSchema?: OptionList;
    showMinionsDetails?: boolean;
    neverActiveMinionsCount?: number;
  };
  pillars?: TaskModel["pillars"];
};
