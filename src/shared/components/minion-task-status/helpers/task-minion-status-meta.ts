import { TaskMinionStatus, type TaskModel, TaskType } from "@saltbox/saltbox-core-api-client";

export function includesPolicyClientStatuses(taskType: TaskType | null | undefined): boolean {
  return taskType === TaskType.Policy;
}

export const TASK_MINION_STATUS_COLORS: Record<TaskMinionStatus, string> = {
  [TaskMinionStatus.Pending]: "#858585",
  [TaskMinionStatus.Busy]: "#FA8C16",
  [TaskMinionStatus.Blocked]: "#722ED1",
  [TaskMinionStatus.Unreachable]: "#13C2C2",
  [TaskMinionStatus.InWork]: "#1677FF",
  [TaskMinionStatus.Success]: "#52C41A",
  [TaskMinionStatus.Failed]: "#FF4D4F",
};

/** Цвета сегментов progress: pending светлее, чем текст в плитках. */
export const TASK_MINION_STATUS_PROGRESS_COLORS: Record<TaskMinionStatus, string> = {
  ...TASK_MINION_STATUS_COLORS,
  [TaskMinionStatus.Pending]: "#D9D9D9",
};

export const TASK_MINION_STATUS_TAG_COLORS: Record<TaskMinionStatus, string> = {
  [TaskMinionStatus.Pending]: "default",
  [TaskMinionStatus.Busy]: "orange",
  [TaskMinionStatus.Blocked]: "purple",
  [TaskMinionStatus.Unreachable]: "cyan",
  [TaskMinionStatus.InWork]: "blue",
  [TaskMinionStatus.Success]: "green",
  [TaskMinionStatus.Failed]: "red",
};

export type TaskMinionStatusI18n = {
  labelKey: string;
  titleKey?: string;
};

export const TASK_MINION_STATUS_I18N: Record<TaskMinionStatus, TaskMinionStatusI18n> = {
  [TaskMinionStatus.Pending]: {
    labelKey: "task.minions.table-pending",
  },
  [TaskMinionStatus.Busy]: {
    labelKey: "task.minions.table-busy",
    titleKey: "task.minions.table-busy-title",
  },
  [TaskMinionStatus.Blocked]: {
    labelKey: "task.minions.table-blocked",
    titleKey: "task.minions.table-blocked-title",
  },
  [TaskMinionStatus.Unreachable]: {
    labelKey: "task.minions.table-unreachable",
    titleKey: "task.minions.table-unreachable-title",
  },
  [TaskMinionStatus.InWork]: {
    labelKey: "task.minions.table-in-work",
  },
  [TaskMinionStatus.Success]: {
    labelKey: "task.minions.table-success",
  },
  [TaskMinionStatus.Failed]: {
    labelKey: "task.minions.table-failed",
  },
};

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

export function getTaskMinionStatusColor(status: TaskMinionStatus): string {
  return TASK_MINION_STATUS_COLORS[status];
}

export function getTaskMinionStatusProgressColor(status: TaskMinionStatus): string {
  return TASK_MINION_STATUS_PROGRESS_COLORS[status];
}

export function getTaskMinionStatusTagColor(status: TaskMinionStatus): string {
  return TASK_MINION_STATUS_TAG_COLORS[status];
}

export function getTaskMinionStatusLabelKey(status: TaskMinionStatus): string {
  return TASK_MINION_STATUS_I18N[status].labelKey;
}

export function getTaskMinionStatusTitleKey(status: TaskMinionStatus): string | undefined {
  return TASK_MINION_STATUS_I18N[status].titleKey;
}

export function isKnownTaskMinionStatus(status: string): status is TaskMinionStatus {
  return Object.prototype.hasOwnProperty.call(TASK_MINION_STATUS_I18N, status);
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
