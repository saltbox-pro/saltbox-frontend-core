import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Collapse, type CollapseProps, Flex, Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getAttemptStatus,
  getShortJobReturnOutput,
  JobReturnSteps,
  parseSaltStates,
} from "saltbox-core/shared/components/job-return";

import { sortJobReturnsChronologically } from "../../utils/chronological-job-return-sort";

import styles from "./minion-task-results-job-result.module.css";

interface MinionTaskResultsJobResultProps {
  jobReturns: JobReturnModel[];
  isJobReturnsLoading: boolean;
}

type AttemptStatus = "success" | "failed" | "unknown";

function resolveAttemptStatus(jobReturn: JobReturnModel, isLoading: boolean): AttemptStatus {
  if (isLoading) {
    return "unknown";
  }

  const states = parseSaltStates(getShortJobReturnOutput(jobReturn));
  if (states) {
    return getAttemptStatus(states);
  }

  const { success, status } = (jobReturn ?? {}) as { success?: boolean; status?: string };

  if (status === "waiting") {
    return "unknown";
  }

  if (typeof success === "boolean") {
    return success ? "success" : "failed";
  }

  return "unknown";
}

function AttemptStatusTag({ status }: { status: AttemptStatus }) {
  const { t } = useTranslation();

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
              <AttemptStatusTag status={resolveAttemptStatus(jobResult, inProcess)} />
            </Flex>
          ),
          children: <JobReturnSteps jobReturn={jobResult} inProcess={inProcess} />,
        };
      }),
    [orderedReturns, isJobReturnsLoading, t]
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
