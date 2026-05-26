import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import { InfoDescriptions, maskPasswordFields } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Collapse, Flex, Spin, Typography } from "antd";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import {
  buildSaltCommandPreview,
  getJobFunctionDescription,
  getJobOverviewParameters,
  hasJobOverviewParameters,
} from "saltbox-core/shared/utils/job-modal-utils";

import { CodeBlock } from "./components/code-block/code-block";
import { JobModalFooter } from "./job-modal-footer";
import styles from "./job-modal-overview-tab.module.css";
import type { JobConfigurationData } from "./job-modal-types";

const { Text } = Typography;

type MasterOption = {
  value: string;
  label: string;
};

export type JobModalOverviewTabProps = {
  fun: string;
  saltFunction?: JobSchemaModel;
  configuration?: JobConfigurationData;
  masterList: MasterOption[];
  isLoading: boolean;
  isError: boolean;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  pluginButtons?: ReactNode;
  onBack: () => void;
  onExecute: () => void;
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

    return getJobOverviewParameters({
      jsonFormValue: configuration.jsonFormValue,
      arg,
      kwarg,
    });
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

  const parametersItems = useMemo(() => {
    return Object.entries(maskedParameters).map(([key, value]) => ({
      key,
      label: key,
      children:
        typeof value === "object" && value !== null ? (
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
        ) : (
          String(value)
        ),
    }));
  }, [maskedParameters]);

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

  return (
    <Flex vertical gap="large">
      <InfoDescriptions title={t("job-modal.overview-general-info")} items={generalInfoItems} />

      {hasJobOverviewParameters(overviewParameters) && (
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
