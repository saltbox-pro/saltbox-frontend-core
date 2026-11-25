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

import type { DurationFieldUnit } from "saltbox-core/shared/utils/job-modal-utils";

export type SelectedTaskTemplate =
  | { kind: "template"; sourceId: string; templateId: string; sourceName?: string }
  | { kind: "custom-function"; fun: string };

export type TaskDurationParts = {
  value: number | null;
  unit: DurationFieldUnit;
};

export type TaskDurationValue = {
  value: number;
  unit: DurationFieldUnit;
};

export type TaskConfigurationFormData = {
  task_template_id: string;
  batch_size: number;
  max_retries: number;
  retry_delay: TaskDurationParts;
  max_jobs_count_at_same_time: number;
  ttl_jobs?: TaskDurationParts;
  ttl_task?: TaskDurationParts;
  save_pillars_as_default: boolean;
  data: TaskData;
};

export type CompleteTaskConfiguration = Omit<
  TaskConfigurationFormData,
  "retry_delay" | "ttl_jobs" | "ttl_task"
> & {
  retry_delay: TaskDurationValue;
  ttl_jobs?: TaskDurationValue;
  ttl_task?: TaskDurationValue;
};

export type TaskSettingsFormValues = Omit<
  TaskConfigurationFormData,
  "data" | "retry_delay" | "ttl_jobs" | "ttl_task"
>;

export type TaskOverviewData = {
  template: TaskTemplateModel;
  configuration: CompleteTaskConfiguration;
  context: TaskCreationContext;
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
