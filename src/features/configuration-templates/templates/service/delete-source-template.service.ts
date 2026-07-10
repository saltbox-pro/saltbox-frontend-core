import { SourceOperation } from "@saltbox/saltbox-core-api-client";

import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { BgTaskPollAbortedError } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { apiCoreStore } from "saltbox-core/store";

import { DELETE_LOCAL_TEMPLATE_OPTIMISTIC_OPERATION } from "../../shared/constants/source-operations";
import type { SourceBgTaskPollingService } from "../../shared/service/source-bg-task-polling.service";
import { isBgTaskPollFailed } from "../../shared/types/bg-task-poll-result";

export type DeleteSourceTemplateServiceDeps = {
  bgTaskPolling: SourceBgTaskPollingService;
  patchOptimisticTask: (sourceId: string, operation: SourceOperation, taskId: string) => void;
  setActionState: (sourceId: string) => void;
  clearActionState: (sourceId: string) => void;
  onComplete?: () => Promise<void>;
};

export async function deleteSourceTemplateApi(
  sourceId: string,
  templateId: string
): Promise<string> {
  const api = apiCoreStore.taskTemplatesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  const response = await api.taskTemplateDelete({
    source_id: sourceId,
    template_id: templateId,
  });

  return extractTaskId(response);
}

export async function deleteSourceTemplateWithPolling(
  deps: DeleteSourceTemplateServiceDeps,
  sourceId: string,
  templateId: string
): Promise<void> {
  deps.setActionState(sourceId);

  try {
    const taskId = await deleteSourceTemplateApi(sourceId, templateId);
    deps.patchOptimisticTask(sourceId, DELETE_LOCAL_TEMPLATE_OPTIMISTIC_OPERATION, taskId);

    const pollResult = await deps.bgTaskPolling.schedule(sourceId, taskId, "reload", true);

    if (pollResult === "aborted") {
      throw new BgTaskPollAbortedError();
    }

    if (isBgTaskPollFailed(pollResult)) {
      throw new BgTaskFailedError(pollResult.error, pollResult.progressMeta);
    }
  } finally {
    deps.clearActionState(sourceId);
    await deps.onComplete?.();
  }
}
