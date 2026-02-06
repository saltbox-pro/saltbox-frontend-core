import { SyncOutlined } from "@ant-design/icons";
import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Flex, Spin } from "antd";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

import styles from "./minion-task-job-returns.module.css";

type JobReturnItem = {
  objectKey?: string;
  __run_num__?: number;
  result?: boolean;
  [key: string]: unknown;
};

interface MinionTaskJobReturnsProps {
  jobReturn: JobReturnModel | undefined;
}

export function MinionTaskJobReturns({ jobReturn }: MinionTaskJobReturnsProps) {
  const { t } = useTranslation();

  const jobReturnData: Array<JobReturnItem | Object> = [];

  if (Array.isArray(jobReturn)) {
    jobReturnData.push(jobReturn);
  } else if (jobReturn && Object.keys(jobReturn).length > 0) {
    Object.entries(jobReturn).forEach(([key, value]) => {
      jobReturnData.push({
        objectKey: key,
        ...value,
      });
    });
    jobReturnData?.sort(
      (a, b) => (b as JobReturnItem)?.__run_num__ - (a as JobReturnItem)?.__run_num__
    );
  } else {
    return (
      <Flex align="center">
        <Spin indicator={<SyncOutlined spin />} size="small" /> {t("task.minion.job-running")}
      </Flex>
    );
  }

  return (
    <Flex vertical gap={20}>
      {jobReturnData.map((item) => {
        const commandTitle = (item as JobReturnItem)?.objectKey && (
          <div className={styles.jobReturnCommand}>{(item as JobReturnItem)?.objectKey}</div>
        );
        let commandContent = item;

        let containerStyles = "";
        if (typeof item === "string") {
          containerStyles += " " + styles.jobResultContentNormal;
        } else if (typeof item === "object") {
          delete (commandContent as JobReturnItem)?.objectKey;
        }

        if ((item as JobReturnItem)?.result === true) {
          containerStyles += " " + styles.jobResultContentSuccess;
        }
        if ((item as JobReturnItem)?.result === false) {
          containerStyles += " " + styles.jobResultContentError;
        }

        return (
          <Flex
            key={(item as JobReturnItem)?.__run_num__}
            className={`${styles.jobResultContent} ${containerStyles}`}
            vertical
          >
            {commandTitle}
            <ReactJson
              displayDataTypes={false}
              enableClipboard={false}
              name={false}
              displayObjectSize={false}
              src={commandContent}
            />
          </Flex>
        );
      })}
    </Flex>
  );
}
