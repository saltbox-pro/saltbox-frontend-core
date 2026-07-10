import type { TaskiqTaskResult } from "@saltbox/saltbox-core-api-client";

import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";

import { isBgTaskFailed, pollBgTaskResult } from "../service/poll-bg-task-result.service";

export async function waitForBgTask(taskId: string, signal?: AbortSignal): Promise<void> {
  await waitForBgTaskWithResult(taskId, signal);
}

export async function waitForBgTaskWithResult(
  taskId: string,
  signal?: AbortSignal
): Promise<TaskiqTaskResult> {
  const result = await pollBgTaskResult(taskId, signal);

  if (isBgTaskFailed(result)) {
    throw new BgTaskFailedError(result.error);
  }

  return result;
}
