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
  const { getJobReturnData, getJobReturnDataState, loadJobReturnData } = jobStore;

  const jobReturnId = row.id;
  const load = getJobReturnDataState(jobReturnId);
  const dataFromRequest = getJobReturnData(jobReturnId);
  const didRequestOnMountRef = useRef(false);
  const didRequestOnIdleRef = useRef(false);

  useEffect(() => {
    if (!jobReturnId) return;
    if (didRequestOnMountRef.current) return;
    didRequestOnMountRef.current = true;

    loadJobReturnData(jobReturnId, { force: true });
  }, [jobReturnId, loadJobReturnData]);

  useEffect(() => {
    if (!jobReturnId) return;

    if (load.status === "idle") {
      if (didRequestOnIdleRef.current) return;
      didRequestOnIdleRef.current = true;
      loadJobReturnData(jobReturnId, { force: true });
      return;
    }

    didRequestOnIdleRef.current = false;
  }, [jobReturnId, load.status, loadJobReturnData]);

  const jobReturnToRender = useMemo(() => {
    return {
      ...row,
      data: dataFromRequest !== undefined ? dataFromRequest : row.data,
    };
  }, [dataFromRequest, row]);

  const isFirstLoad = load.isLoading && load.isInitialLoad;
  const isRefetching = load.isLoading && !load.isInitialLoad;

  return (
    <Flex className={styles.jobReturnsRow} align="center">
      <ErrorZone level="block" loaders={[load]}>
        {load.status === "idle" || isFirstLoad ? (
          <Skeleton.Input block active />
        ) : isStepsView ? (
          <JobReturnSteps jobReturn={jobReturnToRender} inProcess={isRefetching} />
        ) : (
          <JobReturnOutput
            isFullOutput={isFullOutput}
            inProcess={isRefetching}
            jobReturn={jobReturnToRender}
          />
        )}
      </ErrorZone>
    </Flex>
  );
});
