import { TaskMinionStatus, type TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { STATUS_TONE_COLORS, type StatusTone } from "@saltbox/saltbox-frontend-common";

export function includesPolicyClientStatuses(taskType: TaskType | null | undefined): boolean {
  return taskType === TaskType.Policy;
}

type TaskMinionStatusMeta = {
  tone: StatusTone;
  labelKey: string;
  titleKey?: string;
};

const TASK_MINION_STATUS_META: Record<TaskMinionStatus, TaskMinionStatusMeta> = {
  [TaskMinionStatus.Pending]: {
    tone: "pending",
    labelKey: "task.minions.table-pending",
  },
  [TaskMinionStatus.Busy]: {
    tone: "warning",
    labelKey: "task.minions.table-busy",
    titleKey: "task.minions.table-busy-title",
  },
  [TaskMinionStatus.Blocked]: {
    tone: "special",
    labelKey: "task.minions.table-blocked",
    titleKey: "task.minions.table-blocked-title",
  },
  [TaskMinionStatus.Unreachable]: {
    tone: "info",
    labelKey: "task.minions.table-unreachable",
    titleKey: "task.minions.table-unreachable-title",
  },
  [TaskMinionStatus.InWork]: {
    tone: "active",
    labelKey: "task.minions.table-in-work",
  },
  [TaskMinionStatus.Success]: {
    tone: "success",
    labelKey: "task.minions.table-success",
  },
  [TaskMinionStatus.Failed]: {
    tone: "danger",
    labelKey: "task.minions.table-failed",
  },
};

const PENDING_PROGRESS_COLOR = "#D9D9D9";

export type TaskMinionsCountView = {
  total: number;
  pending: number;
  busy: number;
  blocked: number;
  unreachable: number;
  inWork: number;
  success: number;
  failed: number;
};

export function readTaskMinionsCount(
  counts: TaskModel["minions_count"] | null | undefined
): TaskMinionsCountView {
  return {
    total: counts?.total ?? 0,
    pending: counts?.pending ?? 0,
    busy: counts?.busy ?? 0,
    blocked: counts?.blocked ?? 0,
    unreachable: counts?.unreachable ?? 0,
    inWork: counts?.in_work ?? 0,
    success: counts?.success ?? 0,
    failed: counts?.failed ?? 0,
  };
}

export function getTaskMinionStatusMeta(status: TaskMinionStatus): TaskMinionStatusMeta {
  return TASK_MINION_STATUS_META[status];
}

export function getTaskMinionStatusColor(status: TaskMinionStatus): string {
  return STATUS_TONE_COLORS[getTaskMinionStatusMeta(status).tone];
}

export function getTaskMinionStatusProgressColor(status: TaskMinionStatus): string {
  if (status === TaskMinionStatus.Pending) {
    return PENDING_PROGRESS_COLOR;
  }

  return getTaskMinionStatusColor(status);
}

export function getTaskMinionStatusLabelKey(status: TaskMinionStatus): string {
  return getTaskMinionStatusMeta(status).labelKey;
}

export function isKnownTaskMinionStatus(status: string): status is TaskMinionStatus {
  return Object.prototype.hasOwnProperty.call(TASK_MINION_STATUS_META, status);
}

export type TaskMinionCountPopoverRow = {
  status: TaskMinionStatus;
  countKey: keyof Omit<TaskMinionsCountView, "total">;
  policyOnly?: boolean;
};

export const TASK_MINION_COUNT_POPOVER_ROWS: TaskMinionCountPopoverRow[] = [
  {
    status: TaskMinionStatus.InWork,
    countKey: "inWork",
  },
  {
    status: TaskMinionStatus.Busy,
    countKey: "busy",
  },
  {
    status: TaskMinionStatus.Blocked,
    countKey: "blocked",
    policyOnly: true,
  },
  {
    status: TaskMinionStatus.Unreachable,
    countKey: "unreachable",
    policyOnly: true,
  },
  {
    status: TaskMinionStatus.Pending,
    countKey: "pending",
  },
  {
    status: TaskMinionStatus.Failed,
    countKey: "failed",
  },
  {
    status: TaskMinionStatus.Success,
    countKey: "success",
  },
];
