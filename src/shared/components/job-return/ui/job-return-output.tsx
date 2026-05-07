import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Flex, Skeleton, Typography } from "antd";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import type { JobReturnContentStatus } from "../types/status";
import {
  extractStringValue,
  getShortJobReturnOutput,
  getTopLevelRunNumBlocks,
  isJobReturnDataExplicitlyEmpty,
  isJobReturnResultMissing,
  isSimpleBooleanData,
  isSimpleStringData,
  resolveJobReturnContentStatus,
  sortJobReturnOutputByRunNumIfPresent,
} from "../utils/job-return-utils";

import { JobReturnContent } from "./job-return-content";
import styles from "./job-return-output.module.css";

export interface JobReturnOutputProps {
  jobReturn?: JobReturnModel | null;
  isFullOutput?: boolean;
  inProcess?: boolean;
}

export function JobReturnOutput({ isFullOutput, jobReturn, inProcess }: JobReturnOutputProps) {
  const { t } = useTranslation();

  const rawDataToShow = isFullOutput ? jobReturn : getShortJobReturnOutput(jobReturn);
  const dataToShow = sortJobReturnOutputByRunNumIfPresent(rawDataToShow);
  const { status, success } = jobReturn ?? {};
  const contentStatus: JobReturnContentStatus = success ? "success" : "failed";
  const shouldHideNoExecutionForFullOutput = Boolean(
    isFullOutput && isJobReturnDataExplicitlyEmpty(jobReturn)
  );

  const renderValue = (value: unknown, valueStatus: JobReturnContentStatus) => {
    if (isSimpleStringData(value)) {
      return <JobReturnContent status={valueStatus}>{extractStringValue(value)}</JobReturnContent>;
    }

    if (isSimpleBooleanData(value)) {
      return <JobReturnContent status={valueStatus}>{value ? "True" : "False"}</JobReturnContent>;
    }

    return (
      <JobReturnContent status={valueStatus} isPrimitive={false}>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={typeof value === "object" && value !== null ? value : { result: value }}
          collapsed={1}
        />
      </JobReturnContent>
    );
  };

  if ((isJobReturnResultMissing(jobReturn) || inProcess) && !shouldHideNoExecutionForFullOutput) {
    const isWaiting = status === "waiting" || inProcess;
    const labelKey = isWaiting
      ? "job-return.waiting-client-response"
      : "job-return.no-execution-result";

    return (
      <JobReturnContent status="unknown" isPrimitive={false}>
        <Flex align="center" gap={12}>
          {isWaiting && <Skeleton.Input size="small" active />}

          <Typography.Text type="secondary">{t(labelKey)}</Typography.Text>
        </Flex>
      </JobReturnContent>
    );
  }

  const blocks = getTopLevelRunNumBlocks(dataToShow);
  if (blocks) {
    return (
      <Flex vertical gap={8} className={styles.blocksContainer}>
        {blocks.map(({ title, value, runNum }, idx) => {
          const blockStatus = resolveJobReturnContentStatus(value, contentStatus, status);

          return (
            <Flex
              key={`${runNum ?? "x"}-${title ?? idx}`}
              vertical
              gap={6}
              className={styles.blockItem}
            >
              {title && (
                <Typography.Text strong className={styles.blockTitle}>
                  {title}
                </Typography.Text>
              )}
              {renderValue(value, blockStatus)}
            </Flex>
          );
        })}
      </Flex>
    );
  }

  return renderValue(dataToShow, contentStatus);
}
