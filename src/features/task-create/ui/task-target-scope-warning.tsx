import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

import type { TaskTargetMode } from "../helpers/get-task-target-mode";

export type TaskTargetScopeWarningProps = {
  mode: Exclude<TaskTargetMode, "selected">;
  taskType?: TaskType;
  collectionName: string;
};

export function TaskTargetScopeWarning({
  mode,
  taskType,
  collectionName,
}: TaskTargetScopeWarningProps) {
  const { t } = useTranslation();

  const entityType = t(taskType === TaskType.Policy ? "task.type-policy" : "task.type-classic");

  const messageKey =
    mode === "filtered"
      ? "task-create.warning-apply-to-filtered-collection"
      : "task-create.warning-apply-to-whole-collection";

  return (
    <Alert
      type="warning"
      showIcon
      message={t(messageKey, {
        entityType,
        collectionName,
      })}
    />
  );
}
