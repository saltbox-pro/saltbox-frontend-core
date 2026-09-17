import { JobReturnStatus, JobStatus, TaskStatus, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  defaultDateTimeOperators,
  defaultListOperators,
  defaultNumberOperators,
  defaultStringOperators,
  MONGO_VALUE_COERCION_BOOLEAN_FROM_STRING,
} from "@saltbox/saltbox-frontend-common";
import type { SelectProps } from "antd";
import type { TFunction } from "i18next";
import type { OptionList } from "react-querybuilder";

import {
  getEntitySourceTypeSelectOptions,
  JOB_SOURCE_TYPE_FILTER_VALUES,
  TASK_SOURCE_TYPE_FILTER_VALUES,
} from "saltbox-core/shared/entity-source";

export type TasksFilterSchemaOptions = {
  includeTargetCollection?: boolean;
  includeSourceType?: boolean;
  taskType?: TaskType;
};

const statusSelectOptions = (t: TFunction) => [
  { label: t("task.created"), value: TaskStatus.Created },
  { label: t("task.running"), value: TaskStatus.Running },
  { label: t("task.stopping"), value: TaskStatus.Stopping },
  { label: t("task.stopped"), value: TaskStatus.Stopped },
  { label: t("task.finished"), value: TaskStatus.Finished },
  { label: t("task.wait-minions"), value: TaskStatus.WaitMinions },
];

export const getTasksFilterSchema = (
  t: TFunction,
  options: TasksFilterSchemaOptions = {}
): OptionList => {
  const { includeTargetCollection = false, includeSourceType = false, taskType } = options;
  const showSourceType = includeSourceType && taskType === "classic";

  const fields: Array<Record<string, unknown>> = [];

  if (includeTargetCollection) {
    fields.push({
      name: "target_collection.slug",
      label: t("minions.table-collection"),
      operators: defaultStringOperators,
    });
  }

  if (showSourceType) {
    fields.push({
      name: "source.type",
      label: t("entity-source.column"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: getEntitySourceTypeSelectOptions(TASK_SOURCE_TYPE_FILTER_VALUES, t),
    });
  }

  fields.push(
    {
      name: "task_template.title",
      label: t("minions.table-task-template-title"),
      operators: defaultStringOperators,
    },
    {
      name: "task_template.name",
      label: t("minions.table-task-template-name"),
      operators: defaultStringOperators,
    },
    {
      name: "user.name",
      label: t("minions.table-user"),
      operators: defaultStringOperators,
    },
    {
      name: "status.type",
      label: t("minions.table-status"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: statusSelectOptions(t),
    },
    {
      name: "minions_count.total",
      label: t("minions.table-total-clients"),
      operators: defaultNumberOperators,
      inputType: "number",
    },
    {
      name: "minions_count.failed",
      label: t("minions.table-failed-clients"),
      operators: defaultNumberOperators,
      inputType: "number",
    },
    {
      name: "created",
      label: t("minions.table-created"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    }
  );

  return fields as OptionList;
};

const jobStatusSelectOptions = (t: TFunction) => [
  { label: t("jobs.table-status-starting"), value: JobStatus.Starting },
  { label: t("jobs.table-status-running"), value: JobStatus.Running },
  { label: t("jobs.table-status-finished"), value: JobStatus.Finished },
  { label: t("jobs.table-status-launch-error"), value: JobStatus.LaunchError },
];

export const getJobsFilterSchema = (
  t: TFunction,
  saltTargetTypes: SelectProps["options"]
): OptionList =>
  [
    {
      name: "jid",
      label: t("jobs.table-jid"),
      operators: defaultStringOperators,
      caseSensitive: true,
    },
    {
      name: "salt_master",
      label: t("jobs.table-master"),
      operators: defaultStringOperators,
    },
    {
      name: "fun",
      label: t("jobs.table-function"),
      operators: defaultStringOperators,
    },
    {
      name: "tgt",
      label: t("jobs.table-targets"),
      operators: defaultListOperators,
    },
    {
      name: "tgt_type",
      label: t("jobs.table-target-type"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: saltTargetTypes,
      selectFieldNames: { label: "label", value: "value" },
    },
    {
      name: "source.type",
      label: t("entity-source.column"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: getEntitySourceTypeSelectOptions(JOB_SOURCE_TYPE_FILTER_VALUES, t),
    },
    {
      name: "source.id",
      label: t("entity-source.id-column"),
      operators: defaultStringOperators,
      caseSensitive: true,
    },
    {
      name: "user.name",
      label: t("jobs.table-user"),
      operators: defaultStringOperators,
    },
    {
      name: "status",
      label: t("jobs.table-status"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: jobStatusSelectOptions(t),
    },
    {
      name: "created",
      label: t("jobs.table-created"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
  ] as OptionList;

const jobReturnStatusSelectOptions = (t: TFunction) => [
  { label: t("task.job-returns-table.status-waiting"), value: JobReturnStatus.Waiting },
  { label: t("task.job-returns-table.status-timeout"), value: JobReturnStatus.Timeout },
  { label: t("task.job-returns-table.status-ignored"), value: JobReturnStatus.Ignored },
  { label: t("task.job-returns-table.status-success"), value: JobReturnStatus.Success },
  { label: t("task.job-returns-table.status-failed"), value: JobReturnStatus.Failed },
];

export const getMinionJobReturnsFilterSchema = (t: TFunction): OptionList =>
  [
    {
      name: "jid",
      label: t("jobs.table-jid"),
      operators: defaultStringOperators,
      caseSensitive: true,
    },
    {
      name: "status",
      label: t("task.job-returns-table.table-status"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: jobReturnStatusSelectOptions(t),
    },
    {
      name: "fun",
      label: t("task.job-returns-table.table-fun"),
      operators: defaultStringOperators,
    },
    {
      name: "stamp",
      label: t("task.job-returns-table.table-execution-time"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
    {
      name: "created",
      label: t("jobs.table-created"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
  ] as OptionList;

const booleanSelectOptions = (t: TFunction) => [
  { label: t("common.yes"), value: "true" },
  { label: t("common.no"), value: "false" },
];

const equalsOnlyOperators = [{ name: "=", value: "=", label: "=" }];

export type PillarsFilterSchemaOptions = {
  includeTargetId?: boolean;
};

export const getPillarsFilterSchema = (
  t: TFunction,
  options: PillarsFilterSchemaOptions = {}
): OptionList => {
  const { includeTargetId = true } = options;

  return [
    {
      name: "name",
      label: t("pillar.details.name"),
      operators: defaultStringOperators,
    },
    ...(includeTargetId
      ? [
          {
            name: "tgt_info.display_name",
            label: t("pillar.details.target-id"),
            operators: defaultStringOperators,
          },
        ]
      : []),
    {
      name: "is_secret",
      label: t("pillar.details.secret"),
      operators: equalsOnlyOperators,
      valueEditorType: "select",
      values: booleanSelectOptions(t).map(({ label, value }) => ({ label, name: value })),
      mongoValueCoercion: MONGO_VALUE_COERCION_BOOLEAN_FROM_STRING,
    },
    {
      name: "created",
      label: t("pillar.details.created"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
    {
      name: "modified",
      label: t("pillar.details.modified"),
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
  ] as OptionList;
};
