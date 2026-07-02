import {
  CollectionModel,
  TaskCreateRequestSchema,
  TaskData,
  TaskTargetMinion,
  TaskTemplateModel,
  TaskTemplatePublicSchema,
  TaskType,
} from "@saltbox/saltbox-core-api-client";
import { ReactNode } from "react";
import type { OptionList } from "react-querybuilder";

export type TaskTemplateWithRepository = TaskTemplatePublicSchema & {
  repository?: string;
};

export type TaskTemplatePickerItem = TaskTemplateWithRepository & {
  isAccessible: boolean;
};

export type SelectedTaskTemplate = {
  sourceId: string;
  templateId: string;
};

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
  save_pillars_as_default: boolean;
  data: TaskData;
};

export type TaskCreationContext = {
  taskType?: TaskType;
  collection?: CollectionModel;
  minionList?: Array<TaskTargetMinion>;
  query?: object;
  queryFilterSchema?: OptionList;
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
  collectionName?: string;
};
