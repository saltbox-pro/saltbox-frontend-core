import { JobResult } from "@saltbox/saltbox-core-api-client";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";

export const TaskJobReturns = ({
  jobReturns,
  isLoading,
}: {
  jobReturns: Array<JobResult>;
  isLoading: boolean;
}) => {
  return <DefaultJobReturnTable jobReturns={jobReturns} isLoading={isLoading} />;
};
