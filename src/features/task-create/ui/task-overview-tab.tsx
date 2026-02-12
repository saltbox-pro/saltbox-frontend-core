import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TaskDetails, TaskDetailsData } from "saltbox-core/widgets/task/task-details";

import { TaskOverviewData } from "../type/types";

export type TaskOverviewTabProps = {
  isLoading?: boolean;
  overviewData: TaskOverviewData;
  pluginButtons?: ReactNode;
  onBack: () => void;
  onConfirm: () => void;
};

export function TaskOverviewTab({
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
    <Flex vertical gap="middle">
      <TaskDetails data={detailsData} />

      <Flex justify="flex-end" gap="small">
        <Button onClick={onBack}>{t("task-create.back-to-config")}</Button>

        {pluginButtons}

        <Button type="primary" onClick={onConfirm} loading={isLoading}>
          {t("task-create.create-task")}
        </Button>
      </Flex>
    </Flex>
  );
}
