import { useMemo } from "react";

import {
  getTaskPermissions,
  type TaskPermissions,
  type TaskPermissionsInput,
} from "saltbox-core/shared/utils/task-permissions";

export type TaskRunControlInput = TaskPermissionsInput;

export const useTaskPermissions = ({
  taskStatus,
  failedCount,
  pendingCount,
}: TaskRunControlInput): TaskPermissions =>
  useMemo(
    () => getTaskPermissions({ taskStatus, failedCount, pendingCount }),
    [taskStatus, failedCount, pendingCount]
  );
