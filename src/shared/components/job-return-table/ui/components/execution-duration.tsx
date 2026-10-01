import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

import { useFormatAndGetExecutionTimeColor } from "saltbox-core/shared/utils/execution-time-utils";

interface ExecutionDurationProps {
  stamp: string | null | undefined;
  jobReturn: JobReturnModel;
  jobReturns: JobReturnModel[];
}

export const ExecutionDuration = ({ stamp, jobReturn, jobReturns }: ExecutionDurationProps) => {
  const { t } = useTranslation();

  const { formattedTime, color } = useFormatAndGetExecutionTimeColor(
    stamp,
    jobReturn,
    jobReturns,
    t
  );

  return (
    <Typography.Text strong style={{ color }}>
      {formattedTime}
    </Typography.Text>
  );
};
