import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";

import { isBgTaskFailed, pollBgTaskResult } from "../service/poll-bg-task-result.service";

export async function waitForBgTask(taskId: string, signal?: AbortSignal): Promise<void> {
  const result = await pollBgTaskResult(taskId, signal);

  if (isBgTaskFailed(result)) {
    throw new BgTaskFailedError(result.error);
  }
}
