import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import { InfoDescriptions, maskPasswordFields } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Collapse, Flex, Spin, Typography } from "antd";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import { getJobFunctionDescription } from "../params-form-schema";
import { buildSaltCommandPreview, getJobOverviewParameters } from "../request";
import type { JobConfigurationData, JobMasterOption } from "../types";
import { CodeBlock } from "../ui/code-block/code-block";
import { JobModalFooter } from "../ui/footer";

import styles from "./overview-tab.module.css";

const { Text } = Typography;

export type JobModalOverviewTabProps = {
  fun: string;
  saltFunction?: JobSchemaModel;
  configuration?: JobConfigurationData;
  masterList: JobMasterOption[];
  isLoading: boolean;
  isError: boolean;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  pluginButtons?: ReactNode;
  onBack: () => void;
  onExecute: () => void;
};

const renderOverviewValue = (value: unknown) => {
  if (typeof value === "object" && value !== null) {
    return (
      <Flex vertical className={styles.objectContent}>
        <ReactJson
          src={value as object}
          displayDataTypes={false}
          displayObjectSize={false}
          name={false}
          collapsed={3}
          enableClipboard={false}
        />
      </Flex>
    );
  }

  return String(value);
};

export const JobModalOverviewTab = ({
  fun,
  saltFunction,
  configuration,
  masterList,
  isLoading,
  isError,
  arg,
  kwarg,
  pluginButtons,
  onBack,
  onExecute,
}: JobModalOverviewTabProps) => {
  const { t } = useTranslation();

  const functionDescription = useMemo(
    () => getJobFunctionDescription(saltFunction?.json_schema, saltFunction?.ui_schema),
    [saltFunction?.json_schema, saltFunction?.ui_schema]
  );

  const overviewParameters = useMemo(() => {
    if (!configuration) {
      return {};
    }

    return getJobOverviewParameters(configuration, { arg, kwarg });
  }, [configuration, arg, kwarg]);

  const maskedParameters = useMemo(
    () =>
      maskPasswordFields(overviewParameters, saltFunction?.json_schema, saltFunction?.ui_schema),
    [overviewParameters, saltFunction?.json_schema, saltFunction?.ui_schema]
  );

  const generalInfoItems = useMemo(() => {
    const functionLabel = functionDescription ? `${fun} — ${functionDescription}` : fun;

    return [
      {
        label: t("job-modal.overview-function"),
        children: functionLabel,
      },
      {
        label: t("job-modal.overview-command"),
        children: (
          <CodeBlock canCopy content={buildSaltCommandPreview(configuration?.tgt ?? "*", fun)} />
        ),
      },
    ];
  }, [configuration?.tgt, fun, functionDescription, t]);

  const parametersItems = useMemo(
    () =>
      Object.entries(maskedParameters).map(([key, value]) => ({
        key,
        label: key,
        children: renderOverviewValue(value),
      })),
    [maskedParameters]
  );

  const targetInfoItems = useMemo(() => {
    if (!configuration) {
      return [];
    }

    const masterLabel =
      masterList.find((master) => master.value === configuration.salt_master)?.label ??
      configuration.salt_master;

    return [
      {
        label: t("job-modal.salt-master"),
        children: masterLabel,
      },
      {
        label: t("job-modal.overview-target"),
        children: (
          <Text>
            {configuration.tgt_type}: {configuration.tgt}
          </Text>
        ),
      },
    ];
  }, [configuration, masterList, t]);

  if (isError) {
    return <Alert type="error" message={t("job-modal.error-build-overview")} showIcon />;
  }

  if (!configuration || !saltFunction) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 200 }}>
        <Spin />
      </Flex>
    );
  }

  const hasParameters = Object.keys(overviewParameters).length > 0;

  return (
    <Flex vertical gap="large">
      <InfoDescriptions title={t("job-modal.overview-general-info")} items={generalInfoItems} />

      {hasParameters && (
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: "parameters",
              label: t("job-modal.overview-parameters"),
              children: <InfoDescriptions items={parametersItems} />,
            },
          ]}
        />
      )}

      <InfoDescriptions title={t("job-modal.overview-target-nodes")} items={targetInfoItems} />

      <JobModalFooter>
        <Button onClick={onBack}>{t("job-modal.back")}</Button>
        {pluginButtons}
        <Button type="primary" onClick={onExecute} loading={isLoading}>
          {t("job-modal.execute")}
        </Button>
      </JobModalFooter>
    </Flex>
  );
};
