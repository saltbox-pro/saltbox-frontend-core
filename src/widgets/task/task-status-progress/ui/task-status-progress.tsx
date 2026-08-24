import { TaskMinionStatus, TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { useMemo } from "react";

import {
  getTaskMinionStatusProgressColor,
  includesPolicyClientStatuses,
  readTaskMinionsCount,
} from "saltbox-core/shared/components/minion-task-status/helpers/task-minion-status-meta";
import {
  StatusSegmentsProgress,
  type StatusSegmentInput,
} from "saltbox-core/shared/components/status-segments-progress";

interface TaskStatusProgressProps {
  counts: TaskModel["minions_count"] | undefined;
  taskType?: TaskType | null;
}

export function TaskStatusProgress({ counts, taskType }: TaskStatusProgressProps) {
  const showPolicyStatuses = includesPolicyClientStatuses(taskType);
  const { total, pending, busy, blocked, unreachable, inWork, failed, success } =
    readTaskMinionsCount(counts);

  const progressSegments = useMemo((): StatusSegmentInput[] => {
    const segments: StatusSegmentInput[] = [
      {
        id: TaskMinionStatus.Success,
        count: success,
        color: getTaskMinionStatusProgressColor(TaskMinionStatus.Success),
      },
      {
        id: TaskMinionStatus.Failed,
        count: failed,
        color: getTaskMinionStatusProgressColor(TaskMinionStatus.Failed),
      },
      {
        id: TaskMinionStatus.InWork,
        count: inWork,
        color: getTaskMinionStatusProgressColor(TaskMinionStatus.InWork),
      },
      {
        id: TaskMinionStatus.Busy,
        count: busy,
        color: getTaskMinionStatusProgressColor(TaskMinionStatus.Busy),
      },
    ];

    if (showPolicyStatuses) {
      segments.push(
        {
          id: TaskMinionStatus.Blocked,
          count: blocked,
          color: getTaskMinionStatusProgressColor(TaskMinionStatus.Blocked),
        },
        {
          id: TaskMinionStatus.Unreachable,
          count: unreachable,
          color: getTaskMinionStatusProgressColor(TaskMinionStatus.Unreachable),
        }
      );
    }

    segments.push({
      id: TaskMinionStatus.Pending,
      count: pending,
      color: getTaskMinionStatusProgressColor(TaskMinionStatus.Pending),
    });
    return segments;
  }, [blocked, busy, failed, inWork, pending, showPolicyStatuses, success, unreachable]);

  return <StatusSegmentsProgress total={total} segments={progressSegments} />;
}
