import {
  CollectionModel,
  TaskCreateRequestSchema,
  TaskData,
  TaskTargetMinion,
  TaskTemplateModel,
  TaskType,
} from "@saltbox/saltbox-core-api-client";
import { ReactNode } from "react";
import type { OptionList } from "react-querybuilder";

export type SelectedTaskTemplate =
  | { kind: "template"; sourceId: string; templateId: string; sourceName?: string }
  | { kind: "custom-function"; fun: string };

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

export type TaskTemplateDraft = {
  configuration: TaskConfigurationFormData;
  showAdvanced: boolean;
};

export type TaskCreationContext = {
  taskType?: TaskType;
  collection?: CollectionModel;
  minionList?: Array<TaskTargetMinion>;
  query?: object;
  queryFilterSchema?: OptionList;
  slug: string;
  renderPluginButtons?: (data: PluginRenderData, handlers: PluginRenderHandlers) => ReactNode;
};

export type PluginRenderHandlers = {
  onHandoff: () => void;
};

export type PluginRenderData = {
  taskCreateRequest: TaskCreateRequestSchema;
  templateDescription: string;
  collectionName?: string;
};
