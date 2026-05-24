import { InfoDescriptions, type InfoDescriptionsProps } from "@saltbox/saltbox-frontend-common";
import { Flex, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import type { TaskDetailsData } from "../type/task-details-data";

import styles from "./task-details.module.css";

const { Paragraph } = Typography;

export type TaskDetailsProps = {
  data: TaskDetailsData;
  showTargetMinions?: boolean;
  templateInfoExtraItems?: InfoDescriptionsProps["items"];
};

const memoize = createObjectMemoizer();

export function TaskDetails({
  data,
  showTargetMinions = true,
  templateInfoExtraItems,
}: TaskDetailsProps) {
  const { t } = useTranslation();
  const { template, parameters, system, target, pillars } = data;

  const templateParams = useMemo<InfoDescriptionsProps["items"]>(() => {
    const entries = Object.entries(parameters || {}).filter(([key]) => key !== "mods");

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
  }, [parameters]);

  const templateInfo = useMemo<InfoDescriptionsProps["items"]>(() => {
    const baseItems: InfoDescriptionsProps["items"] = [
      {
        label: t("task.details.template-title"),
        children: template.title,
      },
      {
        label: t("task.details.template-function"),
        children: template.saltFunction,
      },
    ];

    return [...baseItems, ...templateParams, ...(templateInfoExtraItems ?? [])];
  }, [t, template.saltFunction, template.title, templateInfoExtraItems, templateParams]);

  const systemParams = useMemo<InfoDescriptionsProps["items"]>(
    () => [
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
    [system.batchSize, system.maxParallelJobs, system.maxRetries, system.retryDelay, t]
  );

  const pillarsInfo = useMemo<InfoDescriptionsProps["items"]>(() => {
    return Object.entries(pillars ?? {}).map(([key, value]) => ({
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
  }, [pillars]);

  const targetInfo = useMemo<InfoDescriptionsProps["items"]>(() => {
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

    const items: InfoDescriptionsProps["items"] = [
      {
        label: t("task.details.collection"),
        children: target?.collection,
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

  return (
    <Flex vertical gap="large">
      <InfoDescriptions title={t("task.details.template-info")} items={templateInfo} />

      {pillarsInfo?.length > 0 && (
        <InfoDescriptions title={t("task.details.pillars")} items={pillarsInfo} />
      )}

      <InfoDescriptions title={t("task.details.system-parameters")} items={systemParams} />

      <InfoDescriptions title={t("task.details.target-info")} items={targetInfo} />
    </Flex>
  );
}
