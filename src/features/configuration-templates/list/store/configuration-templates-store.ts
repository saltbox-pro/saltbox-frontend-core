import {
  SourceOperation,
  SourceType,
  type SourceListWithExtrasSchema,
  type TemplateSourceCreateSchema,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

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
import { sortSources } from "../helpers/sort-sources";

export type ConfigurationTemplatesListStore = SourceActionsPort & {
  load: () => Promise<void>;
  reloadSource: (sourceId: string) => Promise<void>;
  addSourceFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
  deleteSourceFile: (sourceId: string, fileId: string) => Promise<ResourceDeleteResult>;
};

export class ConfigurationTemplatesStore implements ConfigurationTemplatesListStore {
  sources: SourceListWithExtrasSchema[] = [];
  isLoading = false;
  hasLoadedOnce = false;
  hasError = false;

  actionBySourceId = new Map<string, SourceActionKind>();

  private readonly runtime: TemplateSourceRuntime;

  constructor() {
    makeAutoObservable(this);

    this.runtime = new TemplateSourceRuntime(this.createStatePort());
  }

  get sortedSources() {
    return sortSources(this.sources);
  }

  reset = () => {
    this.runtime.reset();
    this.sources = [];
    this.isLoading = false;
    this.hasLoadedOnce = false;
    this.hasError = false;
  };

  private createStatePort(): TemplateSourceStatePort {
    return {
      actionBySourceId: this.actionBySourceId,
      isSourcePresent: (sourceId) => this.sources.some((item) => item.id === sourceId),
      refreshSource: (sourceId) => this.refreshSource(sourceId),
      applySourceUpdate: (updated) => this.applySourceUpdate(updated),
      patchOptimisticOperation: (sourceId, operation) =>
        this.patchOptimisticOperation(sourceId, operation),
      removeSource: (sourceId) => this.removeSourceFromList(sourceId),
      reloadSource: (sourceId) => this.reloadSource(sourceId),
      getSource: (sourceId) => this.sources.find((item) => item.id === sourceId),
    };
  }

  private fetchSources = async (): Promise<SourceListWithExtrasSchema[]> => {
    const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
      TemplateSourceListBody: {},
    });

    return (response?.data ?? []).map(normalizeSourceListItem);
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
      this.runtime.syncForSources(sources);
    } catch (reason) {
      console.error("Failed to load template sources:", reason);
      runInAction(() => {
        if (isGlobalServerError(reason)) return;
        this.hasError = true;
        if (!this.hasLoadedOnce) {
          this.sources = [];
        }
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
        this.hasLoadedOnce = true;
      });
    }
  };

  reloadSource = async (sourceId: string): Promise<void> => {
    try {
      const source = await this.refreshSource(sourceId);
      if (!source) return;

      runInAction(() => {
        const index = this.sources.findIndex((item) => item.id === sourceId);
        if (index === -1) return;

        this.sources[index] = mergeSourceListItemUpdate(this.sources[index], source);
      });
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to reload template source:", reason);
    }
  };

  refreshSource = async (sourceId: string): Promise<SourceListWithExtrasSchema | null> => {
    try {
      return await fetchTemplateSource(sourceId);
    } catch (reason) {
      if (isGlobalServerError(reason)) return null;
      console.error("Failed to refresh template source:", reason);
      return null;
    }
  };

  applySourceUpdate = (updated: SourceListWithExtrasSchema) => {
    const index = this.sources.findIndex((item) => item.id === updated.id);
    if (index === -1) return;

    this.sources[index] = mergeSourceListItemUpdate(this.sources[index], updated);
  };

  addSource = (source: TemplateSourcePublicSchema) => {
    const normalized = normalizeSourceListItem(source);
    this.sources = [normalized, ...this.sources.filter((item) => item.id !== normalized.id)];
  };

  private registerCreatedSource = (
    created: TemplateSourcePublicSchema
  ): SourceListWithExtrasSchema => {
    const normalized = normalizeSourceListItem(created);
    runInAction(() => this.addSource(normalized));
    this.runtime.scheduleForSource(normalized);

    return normalized;
  };

  private createTemplateSource = async (
    schema: TemplateSourceCreateSchema
  ): Promise<SourceListWithExtrasSchema> => {
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
  }): Promise<SourceListWithExtrasSchema> =>
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
  }): Promise<SourceListWithExtrasSchema> =>
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
  }): Promise<SourceListWithExtrasSchema> => {
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

  addSourceFile = (sourceId: string, payload: AddSourceFilePayload): Promise<void> =>
    this.runtime.addSourceFile(sourceId, payload);

  deleteSourceFile = (sourceId: string, fileId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSourceFile(sourceId, fileId);

  plugSource = (sourceId: string): Promise<void> => this.runtime.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.runtime.syncSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSource(sourceId);
}
