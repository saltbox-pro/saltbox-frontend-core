import type { SourceOperation } from "@saltbox/saltbox-core-api-client";

import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { BgTaskPollAbortedError } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { apiCoreStore } from "saltbox-core/store";

import {
  PLUG_OPTIMISTIC_OPERATION,
  REMOVE_OPTIMISTIC_OPERATION,
  SYNC_OPTIMISTIC_OPERATION,
  UNPLUG_OPTIMISTIC_OPERATION,
} from "../constants/source-operations";
import { isApiNotFoundError } from "../helpers/is-api-not-found-error";
import type { SourceBgTaskOutcome } from "../helpers/source-bg-task";
import type { ResourceDeleteResult } from "../types/resource-delete-result";
import type { SourceActionKind } from "../types/source-action";

import type { SourceBgTaskPollingService } from "./source-bg-task-polling.service";

export type TemplateSourceActionsCallbacks = {
  setActionState: (sourceId: string, kind: SourceActionKind) => void;
  clearActionState: (sourceId: string) => void;
  patchOptimisticTask: (sourceId: string, operation: SourceOperation, taskId: string) => void;
  removeSource: (sourceId: string) => void;
  isSourcePresent: (sourceId: string) => boolean;
};

type RunSourceActionOptions = {
  operation: SourceOperation;
  outcome: SourceBgTaskOutcome;
};

export class TemplateSourceActionsService {
  constructor(
    private readonly bgTaskPolling: SourceBgTaskPollingService,
    private readonly callbacks: TemplateSourceActionsCallbacks
  ) {}

  plugSource = async (sourceId: string): Promise<void> => {
    await this.runSourceAction(
      sourceId,
      "plug",
      () => this.getTaskTemplateSourcesApi().templateSourcePlug({ source_id: sourceId }),
      { operation: PLUG_OPTIMISTIC_OPERATION, outcome: "reload" }
    );
  };

  syncSource = async (sourceId: string): Promise<void> => {
    await this.runSourceAction(
      sourceId,
      "sync",
      () => this.getTaskTemplateSourcesApi().templateSourceSync({ source_id: sourceId }),
      { operation: SYNC_OPTIMISTIC_OPERATION, outcome: "reload" }
    );
  };

  unplugSource = async (sourceId: string): Promise<void> => {
    await this.runSourceAction(
      sourceId,
      "unplug",
      () => this.getTaskTemplateSourcesApi().templateSourceUnplug({ source_id: sourceId }),
      { operation: UNPLUG_OPTIMISTIC_OPERATION, outcome: "reload" }
    );
  };

  deleteSource = async (sourceId: string): Promise<ResourceDeleteResult> => {
    this.bgTaskPolling.cancel(sourceId);
    this.callbacks.setActionState(sourceId, "delete");

    try {
      let taskId: string;

      try {
        taskId = await this.getTaskTemplateSourcesApi().templateSourceDelete({
          source_id: sourceId,
        });
      } catch (error) {
        if (isApiNotFoundError(error)) {
          this.callbacks.removeSource(sourceId);
          return "not_found";
        }
        throw error;
      }

      this.callbacks.patchOptimisticTask(sourceId, REMOVE_OPTIMISTIC_OPERATION, taskId);

      const pollResult = await this.bgTaskPolling.schedule(sourceId, taskId, "remove", true);
      if (pollResult !== "ok") {
        return "failed";
      }

      if (!this.callbacks.isSourcePresent(sourceId)) {
        return "deleted";
      }

      throw new Error("Source delete failed");
    } finally {
      this.callbacks.clearActionState(sourceId);
    }
  };

  private getTaskTemplateSourcesApi = () => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");
    return api;
  };

  private runSourceAction = async (
    sourceId: string,
    kind: SourceActionKind,
    mutate: () => Promise<string>,
    options: RunSourceActionOptions
  ) => {
    this.callbacks.setActionState(sourceId, kind);

    try {
      const taskId = await mutate();
      this.callbacks.patchOptimisticTask(sourceId, options.operation, taskId);

      const pollResult = await this.bgTaskPolling.schedule(sourceId, taskId, options.outcome, true);

      if (pollResult === "aborted") {
        throw new BgTaskPollAbortedError();
      }

      if (pollResult === "failed") {
        throw new BgTaskFailedError();
      }
    } finally {
      this.callbacks.clearActionState(sourceId);
    }
  };
}
