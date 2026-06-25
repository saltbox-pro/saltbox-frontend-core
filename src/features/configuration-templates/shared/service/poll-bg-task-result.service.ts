import { TaskState, type TaskiqTaskResult } from "@saltbox/saltbox-core-api-client";

import {
  BgTaskPollAbortedError,
  rethrowIfAborted,
} from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

export const BG_TASK_POLL_INTERVAL_MS = 1500;

const throwIfPollAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw BgTaskPollAbortedError.fromSignal(signal);
  }
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  throwIfPollAborted(signal);

  const timeoutSignal = AbortSignal.timeout(ms);

  return new Promise<void>((resolve, reject) => {
    AbortSignal.any([signal, timeoutSignal]).addEventListener(
      "abort",
      () => {
        if (signal.aborted) {
          reject(BgTaskPollAbortedError.fromSignal(signal));
          return;
        }

        resolve();
      },
      { once: true }
    );
  });
};

export const isBgTaskFailed = (result: TaskiqTaskResult): boolean =>
  result.is_err || result.progress === TaskState.Failure;

export const isBgTaskSettled = (result: TaskiqTaskResult): boolean =>
  isBgTaskFailed(result) || result.progress === TaskState.Success;

const readBgTaskResult = async (
  taskId: string,
  signal?: AbortSignal
): Promise<TaskiqTaskResult> => {
  const api = apiCoreStore.utilsApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  try {
    return await api.readBgTaskResult({ task_id: taskId }, signal ? { signal } : undefined);
  } catch (error) {
    rethrowIfAborted(error, signal);
    throw error;
  }
};

export async function pollBgTaskResult(
  taskId: string,
  signal?: AbortSignal
): Promise<TaskiqTaskResult> {
  while (true) {
    throwIfPollAborted(signal);

    const result = await readBgTaskResult(taskId, signal);

    throwIfPollAborted(signal);

    if (isBgTaskSettled(result)) {
      return result;
    }

    await sleep(BG_TASK_POLL_INTERVAL_MS, signal);
  }
}
