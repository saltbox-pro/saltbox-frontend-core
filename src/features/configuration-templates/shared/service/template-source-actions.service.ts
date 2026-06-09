import type { SourceOperation } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import {
  PLUG_OPTIMISTIC_OPERATION,
  SYNC_OPTIMISTIC_OPERATION,
} from "../constants/source-operations";
import { isApiNotFoundError } from "../helpers/is-api-not-found-error";
import type { ResourceDeleteResult } from "../types/resource-delete-result";
import type { SourceActionKind } from "../types/source-action";

import type { SourcePollingService } from "./source-polling.service";

export type TemplateSourceActionsCallbacks = {
  setActionState: (sourceId: string, kind: SourceActionKind) => void;
  clearActionState: (sourceId: string) => void;
  markOptimisticOperation: (sourceId: string, operation: SourceOperation) => void;
  removeSource: (sourceId: string) => void;
};

export class TemplateSourceActionsService {
  constructor(
    private readonly polling: SourcePollingService,
    private readonly callbacks: TemplateSourceActionsCallbacks
  ) {}

  plugSource = async (sourceId: string): Promise<void> => {
    await this.runSourceAction(sourceId, "plug", () =>
      this.getTaskTemplateSourcesApi().templateSourcePlug({ source_id: sourceId })
    );
  };

  syncSource = async (sourceId: string): Promise<void> => {
    await this.runSourceAction(sourceId, "sync", () =>
      this.getTaskTemplateSourcesApi().templateSourceSync({
        source_id: sourceId,
      })
    );
  };

  deleteSource = async (sourceId: string): Promise<ResourceDeleteResult> => {
    let result: ResourceDeleteResult = "deleted";

    await this.runSourceAction(
      sourceId,
      "delete",
      async () => {
        try {
          await this.getTaskTemplateSourcesApi().templateSourceDelete({ source_id: sourceId });
        } catch (error) {
          if (isApiNotFoundError(error)) {
            result = "not_found";
          } else {
            throw error;
          }
        }
      },
      { refresh: false, remove: true }
    );

    return result;
  };

  private getTaskTemplateSourcesApi = () => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");
    return api;
  };

  private refreshAfterSourceAction = async (sourceId: string, kind: SourceActionKind) => {
    if (kind === "plug") {
      this.callbacks.markOptimisticOperation(sourceId, PLUG_OPTIMISTIC_OPERATION);
    } else if (kind === "sync") {
      this.callbacks.markOptimisticOperation(sourceId, SYNC_OPTIMISTIC_OPERATION);
    }

    await this.polling.scheduleUntilOperationEnd(sourceId, true);
  };

  private runSourceAction = async (
    sourceId: string,
    kind: SourceActionKind,
    mutate: () => Promise<unknown>,
    options?: { refresh?: boolean; remove?: boolean }
  ) => {
    this.callbacks.setActionState(sourceId, kind);

    try {
      await mutate();

      if (options?.remove) {
        this.polling.cancel(sourceId);
        this.callbacks.removeSource(sourceId);
      } else if (options?.refresh !== false) {
        await this.refreshAfterSourceAction(sourceId, kind);
      }
    } finally {
      this.callbacks.clearActionState(sourceId);
    }
  };
}
