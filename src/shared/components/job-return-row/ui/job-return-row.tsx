import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Alert, Flex, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { JobReturnOutput, JobReturnSteps } from "saltbox-core/shared/components/job-return";
import type { JobStore } from "saltbox-core/store";

import styles from "./job-return-row.module.css";

interface JobReturnRowProps {
  row: JobReturnModel;
  jobStore: JobStore;
  isFullOutput?: boolean;
  isStepsView?: boolean;
}

export const JobReturnRow = observer(function JobReturnRow({
  row,
  isFullOutput,
  isStepsView,
  jobStore,
}: JobReturnRowProps) {
  const { t } = useTranslation();

  const { getJobReturnDataStatus, getJobReturnDataError, getJobReturnData, loadJobReturnData } =
    jobStore;

  const jobReturnId = row.id;
  const status = getJobReturnDataStatus(jobReturnId);
  const error = getJobReturnDataError(jobReturnId);
  const dataFromRequest = getJobReturnData(jobReturnId);
  const didRequestOnMountRef = useRef(false);
  const didRequestOnIdleRef = useRef(false);

  useEffect(() => {
    if (!jobReturnId) return;
    if (didRequestOnMountRef.current) return;
    didRequestOnMountRef.current = true;

    loadJobReturnData(jobReturnId, {
      force: true,
      loadingStatus: "in-process",
    });
  }, [jobReturnId, loadJobReturnData]);

  useEffect(() => {
    if (!jobReturnId) return;

    if (status === "idle") {
      if (didRequestOnIdleRef.current) return;
      didRequestOnIdleRef.current = true;
      loadJobReturnData(jobReturnId, {
        force: true,
        loadingStatus: "refetching",
      });
      return;
    }

    didRequestOnIdleRef.current = false;
  }, [jobReturnId, loadJobReturnData, status]);

  const errorMessage = useMemo(() => {
    switch (error) {
      case "not-found":
        return t("job-return.not-found");
      case "access-denied":
        return t("errors.access-denied");
      case "api-unavailable":
      case "load-failed":
        return t("job-return.load-error");
      default:
        return null;
    }
  }, [error, t]);

  const jobReturnToRender = useMemo(() => {
    return {
      ...row,
      data: dataFromRequest !== undefined ? dataFromRequest : row.data,
    };
  }, [dataFromRequest, row]);

  return (
    <Flex className={styles.jobReturnsRow} align="center">
      {status === "error" ? (
        <Alert message={errorMessage} type="error" showIcon />
      ) : status === "idle" || status === "in-process" ? (
        <Skeleton.Input block active />
      ) : isStepsView ? (
        <JobReturnSteps jobReturn={jobReturnToRender} inProcess={status === "refetching"} />
      ) : (
        <JobReturnOutput
          isFullOutput={isFullOutput}
          inProcess={status === "refetching"}
          jobReturn={jobReturnToRender}
        />
      )}
    </Flex>
  );
});
