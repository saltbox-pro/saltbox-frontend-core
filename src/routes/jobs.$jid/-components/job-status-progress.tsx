import { type JobMinionsCountAggregation } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { StatusSegmentsProgress } from "saltbox-core/shared/components/status-segments-progress";

interface JobStatusProgressProps {
  counts: JobMinionsCountAggregation | undefined;
}

export const JobStatusProgress = observer(({ counts }: JobStatusProgressProps) => {
  const {
    total = 0,
    success = 0,
    failed = 0,
    timeout = 0,
    ignored = 0,
    waiting = 0,
  } = counts ?? {};

  const progressSegments = useMemo(
    () => [
      { id: "success", count: success, color: "#52C41A" },
      { id: "failed", count: failed, color: "#FF4D4F" },
      { id: "timeout", count: timeout, color: "#FAAD14" },
      { id: "ignored", count: ignored, color: "#D9D9D9" },
      { id: "waiting", count: waiting, color: "#1677FF" },
    ],
    [failed, ignored, success, timeout, waiting]
  );

  return <StatusSegmentsProgress total={total} segments={progressSegments} />;
});
