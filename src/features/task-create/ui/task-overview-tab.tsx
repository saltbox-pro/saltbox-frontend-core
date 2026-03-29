import { TaskType } from "@saltbox/saltbox-core-api-client";
import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TaskDetails, type TaskDetailsData } from "saltbox-core/widgets/task/task-details";

import type { TaskOverviewData } from "../type/types";

import { TaskCreateFooter } from "./task-create-footer";

export type TaskOverviewTabProps = {
  type: TaskType;
  isLoading?: boolean;
  overviewData: TaskOverviewData;
  pluginButtons?: ReactNode;
  onBack: () => void;
  onConfirm: () => void;
};

export function TaskOverviewTab({
  type,
  isLoading = false,
  overviewData,
  pluginButtons = [],
  onBack,
  onConfirm,
}: TaskOverviewTabProps) {
  const { t } = useTranslation();
  const { template, configuration, context } = overviewData;

  const detailsData = useMemo<TaskDetailsData>(
    () => ({
      template: {
        title: template.title,
        saltFunction: template.fun,
      },
      parameters: configuration.data,
      system: {
        taskType: context.taskType!,
        batchSize: configuration.batch_size,
        maxParallelJobs: configuration.max_jobs_count_at_same_time,
        maxRetries: configuration.max_retries,
        retryDelay: configuration.retry_delay,
      },
      target: {
        collection: context.collection?.slug || context.slug,
        minionIds: context.minionList?.map((minion) => minion.minion_id),
        isQueryBased: !isMongoQueryEmpty(context.query),
      },
    }),
    [template, configuration, context]
  );

  return (
    <Flex vertical>
      <TaskDetails data={detailsData} />

      <TaskCreateFooter>
        <Button onClick={onBack}>{t("task-create.back-to-config")}</Button>

        {pluginButtons}

        <Button type="primary" onClick={onConfirm} loading={isLoading}>
          {t(
            type === TaskType.Policy ? "policy-create.create-button" : "task-create.create-button"
          )}
        </Button>
      </TaskCreateFooter>
    </Flex>
  );
}
