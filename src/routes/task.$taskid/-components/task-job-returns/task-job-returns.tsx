import { JobResult } from "saltbox-core-api";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";

export const TaskJobReturns = ({
  jobReturns,
}: {
  jobReturns: Array<JobResult>;
}) => {
  return <DefaultJobReturnTable jobReturns={jobReturns} />;
};
