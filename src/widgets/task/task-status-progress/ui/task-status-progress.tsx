import { TaskMinionStatus, TaskModel } from "@saltbox/saltbox-core-api-client";
import { useMemo } from "react";

import { StatusSegmentsProgress } from "saltbox-core/shared/components/status-segments-progress";

interface TaskStatusProgressProps {
  counts: TaskModel["minions_count"] | undefined;
}

export function TaskStatusProgress({ counts }: TaskStatusProgressProps) {
  const {
    total = 0,
    pending = 0,
    busy = 0,
    in_work: inWork = busy,
    failed = 0,
    success = 0,
  } = counts ?? {};

  const progressSegments = useMemo(
    () => [
      { id: TaskMinionStatus.Success, count: success, color: "#52C41A" },
      { id: TaskMinionStatus.Failed, count: failed, color: "#FF4D4F" },
      { id: TaskMinionStatus.Failed, count: inWork, color: "#1677FF" },
      { id: TaskMinionStatus.Pending, count: pending, color: "#D9D9D9" },
    ],
    [failed, inWork, pending, success]
  );

  return <StatusSegmentsProgress total={total} segments={progressSegments} />;
}
