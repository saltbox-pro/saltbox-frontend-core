import {
  SourceOperation,
  SourceType,
  type TemplateSourceCreateSchema,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";
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
import { sortSources } from "../helpers/sort-sources";

export type ConfigurationTemplatesListStore = SourceActionsPort & {
  templatesStore: SourceTemplatesStore;
  filesStore: SourceFilesStore;
  addSourceFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
};

export class ConfigurationTemplatesStore implements ConfigurationTemplatesListStore {
  sources: TemplateSourcePublicSchema[] = [];
  isLoading = false;
  hasError = false;

  actionBySourceId = new Map<string, SourceActionKind>();

  templatesStore = new SourceTemplatesStore();
  filesStore = new SourceFilesStore();

  private readonly sourcePolling: SourcePollingService;
  private readonly sourceActions: TemplateSourceActionsService;

  constructor() {
    makeAutoObservable(this);

    this.sourcePolling = new SourcePollingService({
      refreshSource: (sourceId) => this.refreshSource(sourceId),
      applySourceUpdate: (updated) => runInAction(() => this.applySourceUpdate(updated)),
      isSourcePresent: (sourceId) => this.sources.some((item) => item.id === sourceId),
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
      removeSource: (sourceId) => runInAction(() => this.removeSourceFromList(sourceId)),
    });
  }

  get sortedSources() {
    return sortSources(this.sources);
  }

  reset = () => {
    this.sourcePolling.reset();
    this.sources = [];
    this.isLoading = false;
    this.hasError = false;
    this.actionBySourceId.clear();
    this.templatesStore.reset();
    this.filesStore.reset();
  };

  private fetchSources = async (): Promise<TemplateSourcePublicSchema[]> => {
    const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
      TemplateSourceListBody: {},
    });
    return response?.data ?? [];
  };

  load = async () => {
    runInAction(() => {
      this.isLoading = true;
      this.hasError = false;
    });

    try {
      const sources = await this.fetchSources();
      runInAction(() => {
        this.sources = sources;
      });
      this.sourcePolling.syncForSources(sources);
    } catch (reason) {
      console.error("Failed to load template sources:", reason);
      runInAction(() => {
        if (isGlobalServerError(reason)) return;
        this.hasError = true;
        this.sources = [];
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  refreshSource = async (sourceId: string): Promise<TemplateSourcePublicSchema | null> => {
    try {
      return (
        (await apiCoreStore.taskTemplateSourcesApi?.templateSourceGet({ source_id: sourceId })) ??
        null
      );
    } catch (reason) {
      if (isGlobalServerError(reason)) return null;
      console.error("Failed to refresh template source:", reason);
      return null;
    }
  };

  applySourceUpdate = (updated: TemplateSourcePublicSchema) => {
    const index = this.sources.findIndex((item) => item.id === updated.id);
    if (index === -1) return;
    this.sources[index] = updated;
  };

  addSource = (source: TemplateSourcePublicSchema) => {
    this.sources = [source, ...this.sources.filter((item) => item.id !== source.id)];
  };

  private registerCreatedSource = (
    created: TemplateSourcePublicSchema
  ): TemplateSourcePublicSchema => {
    runInAction(() => this.addSource(created));
    this.sourcePolling.scheduleForSource(created);

    return created;
  };

  private createTemplateSource = async (
    schema: TemplateSourceCreateSchema
  ): Promise<TemplateSourcePublicSchema> => {
    const created = await apiCoreStore.taskTemplateSourcesApi?.templateSourceCreate({
      TemplateSourceCreateSchema: schema,
    });

    if (!created) {
      throw new Error("Failed to create template source");
    }

    return this.registerCreatedSource(created);
  };

  createLocalSource = async (payload: {
    name: string;
    description?: string;
  }): Promise<TemplateSourcePublicSchema> =>
    this.createTemplateSource({
      source_type: SourceType.LocalBundle,
      name: payload.name,
      description: payload.description,
    });

  createGitSource = async (payload: {
    name: string;
    description?: string;
    repo_url: string;
    repo_user?: string;
    repo_pass?: string;
    branch?: string;
  }): Promise<TemplateSourcePublicSchema> =>
    this.createTemplateSource({
      source_type: SourceType.GitRepo,
      name: payload.name,
      description: payload.description,
      repo_url: payload.repo_url,
      repo_user: payload.repo_user ?? null,
      repo_pass: payload.repo_pass ?? null,
      branch: payload.branch || "master",
    });

  createArchiveSource = async (payload: {
    name: string;
    description?: string;
    file: File;
  }): Promise<TemplateSourcePublicSchema> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");

    const created = await api.templateSourceCreateFromArchive({
      name: payload.name,
      description: payload.description ?? "",
      file: payload.file,
    });

    return this.registerCreatedSource(created);
  };

  private removeSourceFromList = (sourceId: string) => {
    this.sources = this.sources.filter((item) => item.id !== sourceId);
  };

  private patchOptimisticOperation = (sourceId: string, operation: SourceOperation) => {
    const index = this.sources.findIndex((item) => item.id === sourceId);
    if (index === -1) return;

    const source = this.sources[index];
    if (source.current_operation !== null) return;

    this.sources[index] = { ...source, current_operation: operation };
  };

  addSourceFile = (sourceId: string, payload: AddSourceFilePayload): Promise<void> => {
    const source = this.sources.find((item) => item.id === sourceId);
    if (!source || !canAddSourceFiles(source, this)) {
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
      sourceId,
      payload
    );
  };

  plugSource = (sourceId: string): Promise<void> => this.sourceActions.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.sourceActions.syncSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.sourceActions.deleteSource(sourceId);
}
