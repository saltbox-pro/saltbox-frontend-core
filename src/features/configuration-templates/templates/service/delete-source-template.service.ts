import { SourceOperation } from "@saltbox/saltbox-core-api-client";

import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { BgTaskPollAbortedError } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

import { DELETE_LOCAL_TEMPLATE_OPTIMISTIC_OPERATION } from "../../shared/constants/source-operations";
import type { SourceBgTaskPollingService } from "../../shared/service/source-bg-task-polling.service";

export type DeleteSourceTemplateServiceDeps = {
  bgTaskPolling: SourceBgTaskPollingService;
  patchOptimisticTask: (sourceId: string, operation: SourceOperation, taskId: string) => void;
  setActionState: (sourceId: string) => void;
  clearActionState: (sourceId: string) => void;
  onComplete?: () => Promise<void>;
};

export async function deleteSourceTemplateApi(templateId: string): Promise<string> {
  const api = apiCoreStore.newTaskTemplatesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  return api.newTemplateDelete({ template_id: templateId });
}

export async function deleteSourceTemplateWithPolling(
  deps: DeleteSourceTemplateServiceDeps,
  sourceId: string,
  templateId: string
): Promise<void> {
  deps.setActionState(sourceId);

  try {
    const taskId = await deleteSourceTemplateApi(templateId);
    deps.patchOptimisticTask(sourceId, DELETE_LOCAL_TEMPLATE_OPTIMISTIC_OPERATION, taskId);

    const pollResult = await deps.bgTaskPolling.schedule(sourceId, taskId, "reload", true);

    if (pollResult === "aborted") {
      throw new BgTaskPollAbortedError();
    }

    if (pollResult === "failed") {
      throw new BgTaskFailedError();
    }
  } finally {
    deps.clearActionState(sourceId);
    await deps.onComplete?.();
  }
}
