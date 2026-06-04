import { SourceOperation, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { canAddSourceFiles } from "../../files/helpers/can-add-source-files";
import { SourceFilesStore } from "../../files/model/source-files-store";
import { addSourceFileWithPolling } from "../../files/service/add-source-file.service";
import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import { SourcePollingService } from "../../service/source-polling.service";
import { TemplateSourceActionsService } from "../../shared/service/template-source-actions.service";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { SourceActionKind, SourceActionsPort } from "../../shared/types/source-action";
import { SourceTemplatesStore } from "../../templates/model/source-templates-store";

export class TemplateSourceDetailStore implements SourceActionsPort {
  source: TemplateSourcePublicSchema | null = null;
  isLoading = false;
  hasError = false;
  notFound = false;

  actionBySourceId = new Map<string, SourceActionKind>();

  readonly templatesStore = new SourceTemplatesStore();
  readonly filesStore = new SourceFilesStore();

  private readonly sourcePolling: SourcePollingService;
  private readonly sourceActions: TemplateSourceActionsService;

  constructor(
    private readonly sourceId: string,
    private readonly onSourceRemoved?: () => void
  ) {
    makeAutoObservable(this);

    this.sourcePolling = new SourcePollingService({
      refreshSource: () => this.fetchSource(),
      applySourceUpdate: (updated) =>
        runInAction(() => {
          if (updated.id === this.sourceId) {
            this.source = updated;
          }
        }),
      isSourcePresent: () => this.source?.id === this.sourceId,
    });

    this.sourceActions = new TemplateSourceActionsService(this.sourcePolling, {
      setActionState: (sourceId, kind) =>
        runInAction(() => {
          this.actionBySourceId.set(sourceId, kind);
        }),
      clearActionState: (sourceId) =>
        runInAction(() => {
          this.actionBySourceId.delete(sourceId);
        }),
      markOptimisticOperation: (sourceId, operation) =>
        runInAction(() => this.patchOptimisticOperation(sourceId, operation)),
      removeSource: () =>
        runInAction(() => {
          this.source = null;
          this.onSourceRemoved?.();
        }),
    });
  }

  reset = () => {
    this.sourcePolling.reset();
    runInAction(() => {
      this.source = null;
      this.isLoading = false;
      this.hasError = false;
      this.notFound = false;
      this.actionBySourceId.clear();
    });
    this.templatesStore.reset();
    this.filesStore.reset();
  };

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

      this.sourcePolling.scheduleForSource(source);
      this.templatesStore.loadAll(this.sourceId);
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

  fetchSource = async (): Promise<TemplateSourcePublicSchema | null> => {
    try {
      return (
        (await apiCoreStore.taskTemplateSourcesApi?.templateSourceGet({
          source_id: this.sourceId,
        })) ?? null
      );
    } catch (reason) {
      if (isGlobalServerError(reason)) {
        throw reason;
      }
      console.error("Failed to fetch template source:", reason);
      throw reason;
    }
  };

  private patchOptimisticOperation = (sourceId: string, operation: SourceOperation) => {
    if (this.source?.id !== sourceId || this.source.current_operation !== null) return;

    this.source = { ...this.source, current_operation: operation };
  };

  addSourceFile = (payload: AddSourceFilePayload): Promise<void> => {
    if (!this.source) {
      throw new Error("Source is not loaded");
    }

    if (!canAddSourceFiles(this.source, this)) {
      throw new Error("Cannot add file while source operation is in progress");
    }

    return addSourceFileWithPolling(
      {
        filesStore: this.filesStore,
        polling: this.sourcePolling,
        markOptimisticOperation: (id, operation) => this.patchOptimisticOperation(id, operation),
        setActionState: (id) =>
          runInAction(() => {
            this.actionBySourceId.set(id, "add_file");
          }),
        clearActionState: (id) =>
          runInAction(() => {
            this.actionBySourceId.delete(id);
          }),
      },
      this.source.id,
      payload
    );
  };

  plugSource = (sourceId: string): Promise<void> => this.sourceActions.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.sourceActions.syncSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.sourceActions.deleteSource(sourceId);
}
