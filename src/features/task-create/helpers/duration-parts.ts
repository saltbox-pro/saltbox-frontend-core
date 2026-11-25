import { convertDurationUnitToSeconds } from "@saltbox/saltbox-frontend-common";

import type {
  CompleteTaskConfiguration,
  TaskConfigurationFormData,
  TaskDurationParts,
  TaskDurationValue,
} from "../type/types";

const isDurationValue = (parts: TaskDurationParts | undefined): parts is TaskDurationValue =>
  parts != null && Number.isFinite(parts.value) && parts.value >= 0;

export const secondsToDurationParts = (
  seconds: number | null | undefined
): TaskDurationParts | undefined => {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return undefined;
  }
  return { value: seconds, unit: "seconds" };
};

export const durationPartsToSeconds = (
  parts: TaskDurationParts | undefined
): number | undefined => {
  if (parts == null || parts.value == null || !Number.isFinite(parts.value) || parts.value < 0) {
    return undefined;
  }
  return convertDurationUnitToSeconds(parts.value, parts.unit);
};

export const durationValueToSeconds = (parts: TaskDurationValue): number =>
  convertDurationUnitToSeconds(parts.value, parts.unit);

export const isCompleteTaskConfiguration = (
  configuration: Partial<TaskConfigurationFormData>
): configuration is CompleteTaskConfiguration =>
  typeof configuration.task_template_id === "string" &&
  typeof configuration.batch_size === "number" &&
  typeof configuration.max_retries === "number" &&
  typeof configuration.max_jobs_count_at_same_time === "number" &&
  typeof configuration.save_pillars_as_default === "boolean" &&
  configuration.data != null &&
  isDurationValue(configuration.retry_delay) &&
  (configuration.ttl_jobs == null || isDurationValue(configuration.ttl_jobs)) &&
  (configuration.ttl_task == null || isDurationValue(configuration.ttl_task));
