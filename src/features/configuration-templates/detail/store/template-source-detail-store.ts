import { SourceOperation, type SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import { isApiNotFoundError } from "../../shared/helpers/is-api-not-found-error";
import { resolveConnectedLocalSourceAvailabilityRefresh } from "../../shared/helpers/is-connected-local-template-source";
import {
  mergeSourceListItemUpdate,
  normalizeSourceListItem,
} from "../../shared/helpers/normalize-source-list-item";
import { fetchHasConnectedLocalTemplateSource } from "../../shared/service/fetch-has-connected-local-template-source.service";
import { fetchTemplateSource } from "../../shared/service/fetch-template-source.service";
import { TemplateSourceRuntime } from "../../shared/service/template-source-runtime";
import type { RefreshSourceResult } from "../../shared/types/refresh-source-result";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { SourceActionKind, SourceActionsPort } from "../../shared/types/source-action";
import type { TemplateSourceStatePort } from "../../shared/types/template-source-state-port";
import type { UpdateTemplateSourcePayload } from "../../shared/types/update-template-source";

export class TemplateSourceDetailStore implements SourceActionsPort {
  source: SourceListWithExtrasSchema | null = null;
  isLoading = false;
  hasError = false;
  notFound = false;
  hasConnectedLocalSource = true;

  actionBySourceId = new Map<string, SourceActionKind>();

  private readonly runtime: TemplateSourceRuntime;

  constructor(
    private readonly sourceId: string,
    private readonly onSourceRemoved?: () => void
  ) {
    makeAutoObservable(this);

    this.runtime = new TemplateSourceRuntime(this.createStatePort());
  }

  reset = () => {
    this.runtime.reset();
    runInAction(() => {
      this.source = null;
      this.isLoading = false;
      this.hasError = false;
      this.notFound = false;
      this.hasConnectedLocalSource = true;
    });
  };

  private createStatePort(): TemplateSourceStatePort {
    return {
      actionBySourceId: this.actionBySourceId,
      isSourcePresent: (sourceId) => this.source?.id === sourceId,
      patchOptimisticTask: (sourceId, operation, taskId) =>
        this.patchOptimisticTask(sourceId, operation, taskId),
      applySourceMetadataUpdate: (sourceId, updated) => {
        if (this.source?.id !== sourceId) {
          return;
        }

        this.source = mergeSourceListItemUpdate(this.source, updated);
      },
      removeSource: (_sourceId) =>
        runInAction(() => {
          this.source = null;
          this.onSourceRemoved?.();
        }),
      reloadSource: (_sourceId) => this.reloadSource(),
      getSource: (sourceId) => (this.source?.id === sourceId ? this.source : undefined),
    };
  }

  load = async () => {
    runInAction(() => {
      this.isLoading = true;
      this.hasError = false;
      this.notFound = false;
    });

    try {
      const [refreshResult, connectedLocalSourceResult] = await Promise.all([
        this.fetchRefreshResult(),
        fetchHasConnectedLocalTemplateSource(),
      ]);

      if (refreshResult.status === "not_found") {
        runInAction(() => {
          this.notFound = true;
        });
        return;
      }

      if (refreshResult.status === "failed") {
        runInAction(() => {
          this.hasError = true;
        });
        return;
      }

      runInAction(() => {
        this.source = refreshResult.source;
        this.hasConnectedLocalSource = connectedLocalSourceResult ?? true;
      });

      this.runtime.scheduleForSource(refreshResult.source);
    } catch (reason) {
      console.error("Failed to load template source:", reason);
      runInAction(() => {
        if (isGlobalServerError(reason)) return;
        this.hasError = true;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  reloadSource = async (): Promise<void> => {
    try {
      const previousSource = this.source;
      const refreshResult = await this.fetchRefreshResult();
      if (refreshResult.status !== "found") return;

      const connectedLocalRefresh = resolveConnectedLocalSourceAvailabilityRefresh(
        previousSource,
        refreshResult.source
      );
      let connectedLocalSourceResult: boolean | null = null;

      if (connectedLocalRefresh === "available") {
        connectedLocalSourceResult = true;
      } else if (connectedLocalRefresh === "fetch") {
        connectedLocalSourceResult = await fetchHasConnectedLocalTemplateSource();
      }

      runInAction(() => {
        if (connectedLocalSourceResult !== null) {
          this.hasConnectedLocalSource = connectedLocalSourceResult ?? true;
        }

        if (!this.source) {
          this.source = normalizeSourceListItem(refreshResult.source);
          return;
        }

        this.source = mergeSourceListItemUpdate(this.source, refreshResult.source);
      });
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to reload template source:", reason);
    }
  };

  private fetchRefreshResult = async (): Promise<RefreshSourceResult> => {
    try {
      const source = await fetchTemplateSource(this.sourceId);
      return source ? { status: "found", source } : { status: "not_found" };
    } catch (reason) {
      if (isApiNotFoundError(reason)) return { status: "not_found" };
      if (isGlobalServerError(reason)) return { status: "failed" };
      console.error("Failed to fetch template source:", reason);
      return { status: "failed" };
    }
  };

  private patchOptimisticTask = (sourceId: string, operation: SourceOperation, taskId: string) => {
    if (this.source?.id !== sourceId) return;

    this.source = {
      ...this.source,
      current_operation: operation,
      current_task_id: taskId,
      last_error: null,
    };
  };

  addSourceFile = (payload: AddSourceFilePayload): Promise<void> =>
    this.runtime.addSourceFile(this.sourceId, payload);

  deleteSourceFile = async (fileId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSourceFile(this.sourceId, fileId);

  plugSource = (sourceId: string): Promise<void> => this.runtime.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.runtime.syncSource(sourceId);

  unplugSource = (sourceId: string): Promise<void> => this.runtime.unplugSource(sourceId);

  updateSource = (sourceId: string, payload: UpdateTemplateSourcePayload) =>
    this.runtime.updateSource(sourceId, payload);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSource(sourceId);

  deleteSourceTemplate = (templateId: string): Promise<void> =>
    this.runtime.deleteSourceTemplate(this.sourceId, templateId);
}
