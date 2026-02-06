import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useTranslation } from "react-i18next";

import { MinionTaskJobReturns } from "./minion-task-job-returns";
import styles from "./minion-task-results-job-result.module.css";

interface MinionTaskResultsJobResultProps {
  jobReturns: JobReturnModel[];
}

export function MinionTaskResultsJobResult({ jobReturns }: MinionTaskResultsJobResultProps) {
  const { t } = useTranslation();

  return jobReturns.map((jobResult, jobIndex, jobResults) => {
    return (
      <Flex key={jobResult?.jid ?? jobIndex} className={styles.jobResult} vertical>
        <Flex className={styles.jobResultTitle} gap={5} wrap="wrap">
          {t("task.minion.job-title", {
            run: jobResults.length - jobIndex,
          })}
          : JID
          <Flex gap={5}>
            {jobResult?.jid}
            <CopyToClipboardButton text={jobResult?.jid ?? ""} />
          </Flex>
        </Flex>
        <div className={styles.jobReturnContent}>
          <MinionTaskJobReturns jobReturn={jobResult?.data ?? jobResult} />
        </div>
      </Flex>
    );
  });
}
