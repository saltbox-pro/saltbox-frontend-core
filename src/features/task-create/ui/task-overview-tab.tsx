import { TaskType } from "@saltbox/saltbox-core-api-client";
import {
  isMongoQueryEmpty,
  maskPasswordFields,
  getLocalizedText,
} from "@saltbox/saltbox-frontend-common";
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
  const { t, i18n } = useTranslation();
  const { template, configuration, context } = overviewData;

  const templateInfoExtraItems = useMemo(() => {
    if (!configuration.save_pillars_as_default) {
      return undefined;
    }

    return [
      {
        label: t("task.details.save-pillars-as-default-title"),
        children: t("task.details.save-pillars-as-default-description"),
      },
    ];
  }, [configuration.save_pillars_as_default, t]);

  const detailsData = useMemo<TaskDetailsData>(
    () => ({
      template: {
        title: getLocalizedText(template.title, i18n.language) || template.name,
        saltFunction: template.fun,
      },
      parameters: maskPasswordFields(
        configuration.data,
        template?.json_schema,
        template?.ui_schema
      ),
      system: {
        taskType: context.taskType!,
        batchSize: configuration.batch_size,
        maxParallelJobs: configuration.max_jobs_count_at_same_time,
        maxRetries: configuration.max_retries,
        retryDelay: configuration.retry_delay,
        ttlJobs: configuration.ttl_jobs,
        ttlTask: configuration.ttl_task,
      },
      target: {
        collection: context.collection?.title ?? context.collection?.slug,
        minionIds: context.minionList?.map((minion) => minion.minion_id),
        isQueryBased: !isMongoQueryEmpty(context.query),
        userQuery: context.query,
        userQueryFilterSchema: context.queryFilterSchema,
      },
    }),
    [template, configuration, context, i18n.language]
  );

  return (
    <Flex vertical>
      <TaskDetails data={detailsData} templateInfoExtraItems={templateInfoExtraItems} />

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
