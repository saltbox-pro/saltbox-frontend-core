import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useTranslation } from "react-i18next";

import { JobReturnOutput } from "saltbox-core/shared/components/job-return";

import { sortJobReturnsChronologically } from "../../utils/chronological-job-return-sort";

import styles from "./minion-task-results-job-result.module.css";

interface MinionTaskResultsJobResultProps {
  jobReturns: JobReturnModel[];
  isJobReturnsLoading: boolean;
}

export function MinionTaskResultsJobResult({
  jobReturns,
  isJobReturnsLoading,
}: MinionTaskResultsJobResultProps) {
  const { t } = useTranslation();

  const orderedReturns = sortJobReturnsChronologically(Array.from(jobReturns ?? []));

  return orderedReturns.map((jobResult, jobIndex) => {
    const attemptNo = orderedReturns.length - jobIndex;
    const isActiveAttempt = jobIndex === 0;
    return (
      <Flex key={jobResult?.jid ?? jobIndex} className={styles.jobResult} vertical>
        <Flex className={styles.jobResultTitle} gap={5} wrap="wrap" align="center">
          {t("task.minion.job-title", {
            run: attemptNo,
          })}
          : JID
          <Flex gap={5} align="center">
            {jobResult?.jid}
            <CopyToClipboardButton text={jobResult?.jid ?? ""} />
          </Flex>
        </Flex>

        <JobReturnOutput inProcess={isJobReturnsLoading && isActiveAttempt} jobReturn={jobResult} />
      </Flex>
    );
  });
}
