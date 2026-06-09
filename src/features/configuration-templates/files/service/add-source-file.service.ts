import { SourceOperation } from "@saltbox/saltbox-core-api-client";

import type { SourcePollingService } from "../../shared/service/source-polling.service";
import { isAsyncSourceFileAdd, type AddSourceFilePayload } from "../types/source-file-payload";

export type AddSourceFileServiceDeps = {
  uploadFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
  polling: SourcePollingService;
  markOptimisticOperation: (sourceId: string, operation: SourceOperation) => void;
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
    await deps.uploadFile(sourceId, payload);

    if (isAsync) {
      deps.markOptimisticOperation(sourceId, SourceOperation.AddUserFile);
      await deps.polling.scheduleUntilOperationEnd(sourceId, true);
    }
  } finally {
    deps.clearActionState(sourceId);
    await deps.onComplete?.();
  }
}
