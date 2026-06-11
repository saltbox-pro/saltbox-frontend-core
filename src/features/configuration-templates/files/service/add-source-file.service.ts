import { SourceOperation } from "@saltbox/saltbox-core-api-client";

import type { SourceBgTaskPollingService } from "../../shared/service/source-bg-task-polling.service";
import { isAsyncSourceFileAdd, type AddSourceFilePayload } from "../types/source-file-payload";

export type AddSourceFileServiceDeps = {
  uploadFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<string>;
  bgTaskPolling: SourceBgTaskPollingService;
  patchOptimisticTask: (sourceId: string, operation: SourceOperation, taskId: string) => void;
  setActionState: (sourceId: string) => void;
  clearActionState: (sourceId: string) => void;
  onComplete?: () => Promise<void>;
};

export async function addSourceFileWithPolling(
  deps: AddSourceFileServiceDeps,
  sourceId: string,
  payload: AddSourceFilePayload
): Promise<void> {
  const isAsync = isAsyncSourceFileAdd(payload);

  deps.setActionState(sourceId);

  try {
    const uploadResult = await deps.uploadFile(sourceId, payload);

    if (isAsync) {
      deps.patchOptimisticTask(sourceId, SourceOperation.AddUserFile, uploadResult);
      await deps.bgTaskPolling.schedule(sourceId, uploadResult, "reload", true);
    }
  } finally {
    deps.clearActionState(sourceId);
    await deps.onComplete?.();
  }
}
