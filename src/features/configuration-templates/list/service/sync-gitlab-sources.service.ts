import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { rethrowIfAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { apiCoreStore } from "saltbox-core/store";

import { isBgTaskFailed, pollBgTaskResult } from "../../shared/service/poll-bg-task-result.service";

export type SyncGitlabSourcesDeps = {
  signal?: AbortSignal;
  isCancelled: () => boolean;
};

export async function syncGitlabSources(deps: SyncGitlabSourcesDeps): Promise<void> {
  const api = apiCoreStore.taskTemplateSourcesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  let taskId: string;

  try {
    taskId = extractTaskId(
      await api.templateSourceCheckExternalList(deps.signal ? { signal: deps.signal } : undefined)
    );
  } catch (error) {
    rethrowIfAborted(error, deps.signal);
    throw error;
  }

  if (deps.isCancelled()) return;

  const result = await pollBgTaskResult(taskId, deps.signal);

  if (deps.isCancelled()) return;

  if (isBgTaskFailed(result)) {
    throw new BgTaskFailedError(result.error);
  }
}
