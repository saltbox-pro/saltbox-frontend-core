import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Flex, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";

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
  const { getJobReturnData, getJobReturnDataState, isJobReturnDataStale, loadJobReturnData } =
    jobStore;

  const jobReturnId = row.id;
  const load = getJobReturnDataState(jobReturnId);
  const dataFromRequest = getJobReturnData(jobReturnId);
  const isStale = isJobReturnDataStale(jobReturnId);
  const requestedJobReturnIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobReturnId) return;

    if (requestedJobReturnIdRef.current !== jobReturnId) {
      requestedJobReturnIdRef.current = jobReturnId;
      loadJobReturnData(jobReturnId, { force: true });
      return;
    }

    if (isStale) loadJobReturnData(jobReturnId, { force: true });
  }, [jobReturnId, isStale, loadJobReturnData]);

  const jobReturnToRender = useMemo(() => {
    return {
      ...row,
      data: dataFromRequest !== undefined ? dataFromRequest : row.data,
    };
  }, [dataFromRequest, row]);

  const isLoadingData = load.status === "idle" || load.isLoading || isStale;

  return (
    <Flex className={styles.jobReturnsRow} align="center">
      <ErrorZone level="block" loaders={[load]}>
        {isLoadingData ? (
          <Skeleton.Input block active />
        ) : isStepsView ? (
          <JobReturnSteps jobReturn={jobReturnToRender} />
        ) : (
          <JobReturnOutput isFullOutput={isFullOutput} jobReturn={jobReturnToRender} />
        )}
      </ErrorZone>
    </Flex>
  );
});
