import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

export type TaskApplyToWholeCollectionWarningProps = {
  taskType?: TaskType;
  collectionName: string;
};

export function TaskApplyToWholeCollectionWarning({
  taskType,
  collectionName,
}: TaskApplyToWholeCollectionWarningProps) {
  const { t } = useTranslation();

  const entityType = t(taskType === TaskType.Policy ? "task.type-policy" : "task.type-classic");

  return (
    <Alert
      type="warning"
      showIcon
      message={t("task-create.warning-apply-to-whole-collection", {
        entityType,
        collectionName,
      })}
    />
  );
}
