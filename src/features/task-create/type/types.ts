import {
  CollectionModel,
  TaskCreateRequestSchema,
  TaskData,
  TaskTargetMinion,
  TaskTemplateModel,
  TaskTemplateShortSchema,
  TaskType,
} from "@saltbox/saltbox-core-api-client";
import { ReactNode } from "react";

export type TaskTemplateWithRepository = TaskTemplateShortSchema & {
  repository?: string;
};

export type TemplateListFilterOptions = {
  searchQuery: string;
  repositoryFilter: string | null;
};

export type CreateTaskModalStep = "template-selection" | "task-configuration";

export type TaskOverviewData = {
  template: TaskTemplateModel;
  configuration: TaskConfigurationFormData;
  context: TaskCreationContext;
};

export type TaskConfigurationFormData = {
  task_template_id: string;
  batch_size: number;
  max_retries: number;
  retry_delay: number;
  max_jobs_count_at_same_time: number;
  data: TaskData;
};

export type TaskCreationContext = {
  taskType?: TaskType;
  collection?: CollectionModel;
  minionList?: Array<TaskTargetMinion>;
  query?: object;
  slug: string;
  renderPluginButtons?: (data: PluginRenderData) => ReactNode;
};

export type TaskCreatePlugin = {
  key: string;
  label?: Record<string, string>;
  parcel: unknown;
};

export type PluginRenderData = {
  taskCreateRequest: TaskCreateRequestSchema;
  templateDescription: string;
};
