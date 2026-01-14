import { TaskType } from "@saltbox/saltbox-core-api-client";
import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";
import { Button, Descriptions, Divider, Flex, Typography } from "antd";
import { ComponentProps, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { TaskOverviewData } from "../type/types";

import styles from "./task-overview-tab.module.css";

const { Title, Text } = Typography;

export type TaskOverviewTabProps = {
  isLoading?: boolean;
  overviewData: TaskOverviewData;
  pluginButtons?: ReactNode;
  onBack: () => void;
  onConfirm: () => void;
};

type DescriptionItems = ComponentProps<typeof Descriptions>["items"];

const memoize = createObjectMemoizer();

export function TaskOverviewTab({
  isLoading = false,
  overviewData,
  pluginButtons = [],
  onBack,
  onConfirm,
}: TaskOverviewTabProps) {
  const { t } = useTranslation();
  const { template, configuration, context } = overviewData;

  const templateInfo = useMemo<DescriptionItems>(
    () => [
      {
        label: t("task-create.template-title"),
        children: template.title,
      },
      {
        label: t("task-create.template-id"),
        children: template.id,
      },
      {
        label: t("task-create.template-function"),
        children: template.fun,
      },
    ],
    [t, template]
  );

  const templateParams = useMemo<DescriptionItems>(() => {
    return Object.entries(configuration.data || {}).map(([key, value]) => ({
      key,
      label: key,
      children:
        typeof value === "object" ? (
          <Flex>
            <pre className={styles.objectContent}>{JSON.stringify(value, null, 2)}</pre>
          </Flex>
        ) : (
          String(value)
        ),
    }));
  }, [configuration.data]);

  const hasConfigurationData = Object.keys(configuration.data || {}).length > 0;

  const systemParams = useMemo<DescriptionItems>(
    () => [
      {
        label: t("task-create.task-type"),
        children:
          context.taskType === TaskType.Classic
            ? t("task-create.task-type-classic")
            : t("task-create.task-type-policy"),
      },
      {
        label: t("task-create.batch-size"),
        children:
          configuration.batch_size === 0 ? t("task-create.no-batching") : configuration.batch_size,
      },
      {
        label: t("task-create.max-parallel-jobs"),
        children: configuration.max_jobs_count_at_same_time,
      },
      {
        label: t("task-create.max-retries"),
        children: configuration.max_retries,
      },
      {
        label: t("task-create.retry-delay"),
        children: t("task-create.retry-delay-seconds", { count: configuration.retry_delay }),
      },
    ],
    [t, configuration, context.taskType]
  );

  const targetInfo = useMemo<DescriptionItems>(() => {
    const getTargetMinionsInfo = () => {
      if (context.minionList?.length > 0) {
        const minionIds = context.minionList.map((minion) => minion.minion_id);

        const renderMinionIds = () =>
          minionIds.map((minionId, i) => (
            <span key={minionId} className={styles.minionId}>
              {minionId}
              {i < minionIds.length - 1 ? <>,&nbsp;</> : null}
            </span>
          ));

        return (
          <Typography.Paragraph
            className={styles.minionList}
            ellipsis={{
              rows: 4,
              tooltip: {
                title: <span>{renderMinionIds()}</span>,
                classNames: memoize({
                  root: styles.minionTooltipRoot,
                  body: styles.minionTooltipBody,
                }),
              },
            }}
          >
            {renderMinionIds()}
          </Typography.Paragraph>
        );
      }

      if (isMongoQueryEmpty(context.query)) {
        return t("task-create.no-query-selection");
      }

      return t("task-create.query-based-selection");
    };

    return [
      {
        label: t("task-create.collection"),
        children: context.collection?.slug || context.slug,
      },
      {
        label: t("task-create.target-minions"),
        children: getTargetMinionsInfo(),
      },
    ];
  }, [t, context.collection, context.slug, context.minionList, context.query]);

  return (
    <Flex vertical gap="middle">
      <Flex vertical gap="middle">
        <Descriptions
          title={t("task-create.template-info")}
          bordered
          size="small"
          column={1}
          items={templateInfo}
          classNames={memoize({
            header: styles.descriptionHeader,
            label: styles.descriptionLabel,
            content: styles.descriptionContent,
          })}
        />

        <Divider className={styles.divider} />

        <div>
          <Title level={5}>{t("task-create.template-parameters")}</Title>
          {hasConfigurationData ? (
            <Descriptions
              bordered
              size="small"
              column={1}
              items={templateParams}
              classNames={memoize({
                header: styles.descriptionHeader,
                label: styles.descriptionLabel,
                content: styles.descriptionContent,
              })}
            />
          ) : (
            <Text type="secondary">{t("task-create.no-parameters")}</Text>
          )}
        </div>

        <Divider className={styles.divider} />

        <Descriptions
          title={t("task-create.system-parameters")}
          bordered
          size="small"
          column={1}
          items={systemParams}
          classNames={memoize({
            header: styles.descriptionHeader,
            label: styles.descriptionLabel,
            content: styles.descriptionContent,
          })}
        />

        <Divider className={styles.divider} />

        <Descriptions
          title={t("task-create.target-info")}
          bordered
          size="small"
          column={1}
          items={targetInfo}
          classNames={memoize({
            header: styles.descriptionHeader,
            label: styles.descriptionLabel,
            content: styles.descriptionContent,
          })}
        />
      </Flex>

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
