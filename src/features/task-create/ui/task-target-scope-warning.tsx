import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Alert, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { CollectionAppliedFilterPopover } from "saltbox-core/shared/components/collection-applied-filter-popover";

import type { TaskTargetMode } from "../helpers/get-task-target-mode";
import type { TaskCreationContext } from "../type/types";

export type TaskTargetScopeWarningProps = {
  mode: Exclude<TaskTargetMode, "selected">;
  taskType?: TaskType;
  collectionName: string;
  userQuery?: object;
  userQueryFilterSchema?: TaskCreationContext["queryFilterSchema"];
};

export function TaskTargetScopeWarning({
  mode,
  taskType,
  collectionName,
  userQuery,
  userQueryFilterSchema,
}: TaskTargetScopeWarningProps) {
  const { t } = useTranslation();

  const entityType = t(taskType === TaskType.Policy ? "task.type-policy" : "task.type-classic");

  const messageKey =
    mode === "filtered"
      ? "task-create.warning-apply-to-filtered-collection"
      : "task-create.warning-apply-to-whole-collection";

  const messageText = t(messageKey, {
    entityType,
    collectionName,
  });

  return (
    <Alert
      type="warning"
      showIcon
      message={
        <Flex align="center" gap={5}>
          <span>{messageText}</span>

          {mode === "filtered" && (
            <CollectionAppliedFilterPopover
              query={userQuery}
              filterSchema={userQueryFilterSchema}
            />
          )}
        </Flex>
      }
    />
  );
}
