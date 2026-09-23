import { JobReturnStatus, type JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Collapse, type CollapseProps, Flex, Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getAttemptStatus,
  getShortJobReturnOutput,
  JobReturnStatusTag,
  JobReturnSteps,
  parseSaltStates,
} from "saltbox-core/shared/components/job-return";

import { sortJobReturnsChronologically } from "../../utils/chronological-job-return-sort";

import styles from "./minion-task-results-job-result.module.css";
import { MinionTaskResultsTtl, type MinionTaskResultsTtlProps } from "./minion-task-results-ttl";

interface MinionTaskResultsJobResultProps {
  jobReturns: JobReturnModel[];
  isJobReturnsLoading: boolean;
  onTtlApplied: MinionTaskResultsTtlProps["onTtlApplied"];
}

type AttemptStatus = "success" | "failed" | "unknown";

const NO_RESULT_STATUSES: ReadonlySet<string> = new Set([
  JobReturnStatus.Waiting,
  JobReturnStatus.Timeout,
  JobReturnStatus.Ignored,
]);

function resolveAttemptStatus(jobReturn: JobReturnModel): AttemptStatus {
  const states = parseSaltStates(getShortJobReturnOutput(jobReturn));
  if (states) {
    return getAttemptStatus(states);
  }

  const { success, status } = jobReturn;

  if (typeof success === "boolean") {
    return success ? "success" : "failed";
  }

  if (status === JobReturnStatus.Success) {
    return "success";
  }

  if (status === JobReturnStatus.Failed) {
    return "failed";
  }

  return "unknown";
}

function AttemptStatusTag({
  jobReturn,
  isLoading,
}: {
  jobReturn: JobReturnModel;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return null;
  }

  if (jobReturn.status && NO_RESULT_STATUSES.has(jobReturn.status)) {
    return <JobReturnStatusTag status={jobReturn.status} />;
  }

  const status = resolveAttemptStatus(jobReturn);
  if (status === "unknown") {
    return null;
  }

  return (
    <Tag color={status === "success" ? "success" : "error"}>
      {t(`task.minion.attempt-status-${status}`)}
    </Tag>
  );
}

export function MinionTaskResultsJobResult({
  jobReturns,
  isJobReturnsLoading,
  onTtlApplied,
}: MinionTaskResultsJobResultProps) {
  const { t } = useTranslation();

  const orderedReturns = useMemo(
    () => sortJobReturnsChronologically(Array.from(jobReturns ?? [])),
    [jobReturns]
  );

  const items = useMemo<CollapseProps["items"]>(
    () =>
      orderedReturns.map((jobResult, jobIndex) => {
        const attemptNo = orderedReturns.length - jobIndex;
        const isActiveAttempt = jobIndex === 0;
        const inProcess = isJobReturnsLoading && isActiveAttempt;
        const key = jobResult?.jid ?? String(jobIndex);

        return {
          key,
          label: (
            <Flex className={styles.jobResultTitle} gap={8} wrap="wrap" align="center">
              <span>
                {t("task.minion.job-title", { run: attemptNo })}: JID {jobResult?.jid}
              </span>
              <CopyToClipboardButton
                title={t("job-return.copy-job-data-to-clipboard")}
                text={jobResult?.data == null ? "" : JSON.stringify(jobResult.data, null, 2)}
              />
              <AttemptStatusTag jobReturn={jobResult} isLoading={inProcess} />
            </Flex>
          ),
          extra: <MinionTaskResultsTtl jobReturn={jobResult} onTtlApplied={onTtlApplied} />,
          children: <JobReturnSteps jobReturn={jobResult} inProcess={inProcess} />,
        };
      }),
    [orderedReturns, isJobReturnsLoading, onTtlApplied, t]
  );

  const defaultActiveKey = useMemo(
    () => (orderedReturns.length > 0 ? [orderedReturns[0]?.jid ?? "0"] : []),
    [orderedReturns]
  );

  if (orderedReturns.length === 0) return null;

  return (
    <Collapse
      className={styles.collapse}
      size="small"
      defaultActiveKey={defaultActiveKey}
      items={items}
    />
  );
}
