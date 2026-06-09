import { SourceOperation, type SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import {
  mergeSourceListItemUpdate,
  normalizeSourceListItem,
} from "../../shared/helpers/normalize-source-list-item";
import { fetchTemplateSource } from "../../shared/service/fetch-template-source.service";
import { TemplateSourceRuntime } from "../../shared/service/template-source-runtime";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { SourceActionKind, SourceActionsPort } from "../../shared/types/source-action";
import type { TemplateSourceStatePort } from "../../shared/types/template-source-state-port";

export class TemplateSourceDetailStore implements SourceActionsPort {
  source: SourceListWithExtrasSchema | null = null;
  isLoading = false;
  hasError = false;
  notFound = false;

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
    });
  };

  private createStatePort(): TemplateSourceStatePort {
    return {
      actionBySourceId: this.actionBySourceId,
      isSourcePresent: (sourceId) => this.source?.id === sourceId,
      refreshSource: (_sourceId) => this.fetchSource(),
      applySourceUpdate: (updated) => this.applySourceUpdate(updated),
      patchOptimisticOperation: (sourceId, operation) =>
        this.patchOptimisticOperation(sourceId, operation),
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
      const source = await this.fetchSource();
      if (!source) {
        runInAction(() => {
          this.notFound = true;
        });
        return;
      }

      runInAction(() => {
        this.source = source;
      });

      this.runtime.scheduleForSource(source);
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
      const source = await this.fetchSource();
      if (!source) return;

      runInAction(() => {
        if (!this.source) {
          this.source = normalizeSourceListItem(source);
          return;
        }

        this.source = mergeSourceListItemUpdate(this.source, source);
      });
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to reload template source:", reason);
    }
  };

  fetchSource = async (): Promise<SourceListWithExtrasSchema | null> => {
    try {
      return await fetchTemplateSource(this.sourceId);
    } catch (reason) {
      if (isGlobalServerError(reason)) {
        throw reason;
      }
      console.error("Failed to fetch template source:", reason);
      throw reason;
    }
  };

  applySourceUpdate = (updated: SourceListWithExtrasSchema) => {
    if (!this.source || updated.id !== this.sourceId) return;

    this.source = mergeSourceListItemUpdate(this.source, updated);
  };

  private patchOptimisticOperation = (sourceId: string, operation: SourceOperation) => {
    if (this.source?.id !== sourceId || this.source.current_operation !== null) return;

    this.source = { ...this.source, current_operation: operation };
  };

  addSourceFile = (payload: AddSourceFilePayload): Promise<void> =>
    this.runtime.addSourceFile(this.sourceId, payload);

  deleteSourceFile = async (fileId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSourceFile(this.sourceId, fileId);

  plugSource = (sourceId: string): Promise<void> => this.runtime.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.runtime.syncSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSource(sourceId);
}
