import type { TaskData } from "@saltbox/saltbox-core-api-client";
import { deepOmitUndefined } from "@saltbox/saltbox-frontend-common";

import type { TaskConfigurationFormData } from "../type/types";

type ConfigurationDefaults = Pick<
  TaskConfigurationFormData,
  "batch_size" | "max_retries" | "retry_delay" | "max_jobs_count_at_same_time"
>;

type BuildTaskConfigurationFormDataParams = {
  templateId: string;
  settings: Partial<Omit<TaskConfigurationFormData, "data" | "task_template_id">>;
  data?: TaskData;
  defaults: ConfigurationDefaults;
};

export function buildTaskConfigurationFormData({
  templateId,
  settings,
  data = {},
  defaults,
}: BuildTaskConfigurationFormDataParams): TaskConfigurationFormData {
  return {
    task_template_id: templateId,
    batch_size: settings.batch_size ?? defaults.batch_size,
    max_retries: settings.max_retries ?? defaults.max_retries,
    retry_delay: settings.retry_delay ?? defaults.retry_delay,
    max_jobs_count_at_same_time:
      settings.max_jobs_count_at_same_time ?? defaults.max_jobs_count_at_same_time,
    data: deepOmitUndefined(data),
    save_pillars_as_default: settings.save_pillars_as_default ?? true,
  };
}
