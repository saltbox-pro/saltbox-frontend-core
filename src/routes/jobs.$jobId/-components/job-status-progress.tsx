import { type JobMinionsCountAggregation } from "@saltbox/saltbox-core-api-client";
import { StatusSegmentsProgress } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";

import {
  getJobReturnStatusColor,
  JOB_RETURN_STATUS_COUNT_ORDER,
} from "saltbox-core/shared/components/job-return";

type JobStatusProgressProps = {
  counts: JobMinionsCountAggregation | undefined;
};

export const JobStatusProgress = observer(({ counts }: JobStatusProgressProps) => {
  const progressSegments = JOB_RETURN_STATUS_COUNT_ORDER.map((status) => ({
    id: status,
    count: counts?.[status] ?? 0,
    color: getJobReturnStatusColor(status),
  }));

  return <StatusSegmentsProgress total={counts?.total ?? 0} segments={progressSegments} />;
});
