import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Descriptions, Flex, Typography } from "antd";
import { type ComponentProps, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { TaskDetailsData } from "../type/task-details-data";

import styles from "./task-details.module.css";

const { Text, Paragraph } = Typography;

export type TaskDetailsProps = {
  data: TaskDetailsData;
  showTargetMinions?: boolean;
};

type DescriptionItems = ComponentProps<typeof Descriptions>["items"];

const memoize = createObjectMemoizer();

export function TaskDetails({ data, showTargetMinions = true }: TaskDetailsProps) {
  const { t } = useTranslation();
  const { template, parameters, system, target } = data;

  const templateInfo = useMemo<DescriptionItems>(
    () => [
      {
        label: t("task.details.template-title"),
        children: template.title,
      },
      {
        label: t("task.details.template-function"),
        children: template.saltFunction,
      },
    ],
    [t, template]
  );

  const parametersRecord = parameters as Record<string, unknown> | undefined;

  const templateParams = useMemo<DescriptionItems>(() => {
    const entries = Object.entries(parametersRecord || {}).filter(([key]) => key !== "mods");

    return entries.map(([key, value]) => ({
      key,
      label: key,
      children:
        typeof value === "object" && value !== null ? (
          <Flex vertical className={styles.objectContent}>
            <ReactJson
              src={value}
              displayDataTypes={false}
              displayObjectSize={false}
              name={false}
              collapsed={3}
              enableClipboard={false}
            />
          </Flex>
        ) : (
          String(value)
        ),
    }));
  }, [parametersRecord]);

  const hasParameters = Object.keys(parametersRecord || {}).length > 0;

  const systemParams = useMemo<DescriptionItems>(
    () => [
      {
        label: t("task.details.task-type"),
        children:
          system.taskType === TaskType.Classic
            ? t("task.details.task-type-classic")
            : t("task.details.task-type-policy"),
      },
      {
        label: t("task.details.batch-size"),
        children: system.batchSize === 0 ? t("task.details.no-batching") : system.batchSize,
      },
      {
        label: t("task.details.max-parallel-jobs"),
        children: system.maxParallelJobs,
      },
      {
        label: t("task.details.max-retries"),
        children: system.maxRetries,
      },
      {
        label: t("task.details.retry-delay"),
        children: t("task.details.retry-delay-seconds", { count: system.retryDelay }),
      },
    ],
    [t, system]
  );

  const targetInfo = useMemo<DescriptionItems>(() => {
    const getTargetMinionsInfo = () => {
      if (target.minionIds && target.minionIds.length > 0) {
        const renderMinionIds = () =>
          target.minionIds!.map((minionId, i) => (
            <span key={minionId} className={styles.minionId}>
              {minionId}
              {i < target.minionIds!.length - 1 ? <>,&nbsp;</> : null}
            </span>
          ));

        return (
          <Paragraph
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
          </Paragraph>
        );
      }

      if (!target.isQueryBased) {
        return t("task.details.no-query-selection");
      }

      return t("task.details.query-based-selection");
    };

    const items: DescriptionItems = [
      {
        label: t("task.details.collection"),
        children: target.collection,
      },
    ];

    if (showTargetMinions) {
      items.push({
        label: t("task.details.target-minions"),
        children: getTargetMinionsInfo(),
      });
    }

    return items;
  }, [t, target, showTargetMinions]);

  const descriptionClassNames = memoize({
    header: styles.descriptionHeader,
    label: styles.descriptionLabel,
    content: styles.descriptionContent,
    title: styles.descriptionTitle,
  });

  return (
    <Flex vertical gap="large">
      <Descriptions
        title={t("task.details.template-info")}
        bordered
        size="small"
        column={1}
        items={templateInfo}
        classNames={descriptionClassNames}
      />

      <Flex vertical>
        <Text className={styles.descriptionHeader} strong>
          {t("task.details.template-parameters")}
        </Text>
        {hasParameters ? (
          <Descriptions
            bordered
            size="small"
            column={1}
            items={templateParams}
            classNames={descriptionClassNames}
          />
        ) : (
          <Text type="secondary">{t("task.details.no-parameters")}</Text>
        )}
      </Flex>

      <Descriptions
        title={t("task.details.system-parameters")}
        bordered
        size="small"
        column={1}
        items={systemParams}
        classNames={descriptionClassNames}
      />

      <Descriptions
        title={t("task.details.target-info")}
        bordered
        size="small"
        column={1}
        items={targetInfo}
        classNames={descriptionClassNames}
      />
    </Flex>
  );
}
