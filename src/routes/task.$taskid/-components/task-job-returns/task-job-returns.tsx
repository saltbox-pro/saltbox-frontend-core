import React from "react";
import { JobResult } from "@saltbox/saltbox-core-api-client";
import { DefaultJobReturnTable } from "saltbox-core/shared/components/job-return-table/default/default-job-return-table";

type TaskJobReturnsProps = {
  jobReturns: Array<JobResult>;
  isFullOutput?: boolean;
};

export const TaskJobReturns: React.FC<TaskJobReturnsProps> = ({
  jobReturns,
  isFullOutput = false,
}) => {
  return <DefaultJobReturnTable jobReturns={jobReturns} isFullOutput={isFullOutput} />;
};
