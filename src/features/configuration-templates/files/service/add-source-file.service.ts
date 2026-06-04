import { SourceOperation } from "@saltbox/saltbox-core-api-client";

import type { SourcePollingService } from "../../service/source-polling.service";
import type { SourceFilesStore } from "../model/source-files-store";
import { isAsyncSourceFileAdd, type AddSourceFilePayload } from "../types/source-file-payload";

export type AddSourceFileServiceDeps = {
  filesStore: SourceFilesStore;
  polling: SourcePollingService;
  markOptimisticOperation: (sourceId: string, operation: SourceOperation) => void;
  setActionState: (sourceId: string) => void;
  clearActionState: (sourceId: string) => void;
};

export async function addSourceFileWithPolling(
  deps: AddSourceFileServiceDeps,
  sourceId: string,
  payload: AddSourceFilePayload
): Promise<void> {
  const isAsync = isAsyncSourceFileAdd(payload);

  deps.setActionState(sourceId);

  try {
    await deps.filesStore.addFile(sourceId, payload);

    if (isAsync) {
      deps.markOptimisticOperation(sourceId, SourceOperation.AddUserFile);
      await deps.polling.scheduleUntilOperationEnd(sourceId, true);
    }
  } finally {
    deps.clearActionState(sourceId);
    await deps.filesStore.loadAll(sourceId, { force: true });
  }
}
