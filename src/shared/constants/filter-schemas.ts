import { TaskStatus, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  defaultDateTimeOperators,
  defaultListOperators,
  defaultNumberOperators,
  defaultStringOperators,
} from "@saltbox/saltbox-frontend-common";
import type { SelectProps } from "antd";
import type { TFunction } from "i18next";
import type { OptionList } from "react-querybuilder";

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

const sourceTypeSelectOptions = (t: TFunction) => [
  { label: t("minions.table-soruce-type-rest"), value: "rest" },
  { label: t("minions.table-soruce-type-scheduler"), value: "scheduler" },
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
      label: t("minions.table-source-type"),
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: sourceTypeSelectOptions(t),
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

export const getJobsFilterSchema = (saltTargetTypes: SelectProps["options"]): OptionList =>
  [
    {
      name: "jid",
      label: "JID",
      operators: defaultStringOperators,
    },
    {
      name: "salt_master",
      label: "Master",
      operators: defaultStringOperators,
    },
    {
      name: "fun",
      label: "Function",
      operators: defaultStringOperators,
    },
    {
      name: "tgt",
      label: "Targets",
      operators: defaultStringOperators,
    },
    {
      name: "tgt_type",
      label: "Target Type",
      operators: defaultListOperators,
      type: "multiselect",
      selectOptions: saltTargetTypes,
      selectFieldNames: { label: "label", value: "value" },
    },
    {
      name: "user.name",
      label: "User",
      operators: defaultStringOperators,
    },
    {
      name: "created",
      label: "Created",
      operators: defaultDateTimeOperators,
      inputType: "datetime-local",
      valueEditorType: "datetime-local",
    },
  ] as OptionList;
