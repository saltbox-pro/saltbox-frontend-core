import {
  SourceOperation,
  SourceState,
  SourceType,
  type TemplateSourceCreateSchema,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { sortSources } from "../helpers/source-presentation";

import type { SourceCardAction } from "./source-action";
import { SourceTemplatesStore } from "./source-templates-store";

const SOURCE_POLL_INTERVAL_MS = 2000;
const SOURCE_POLL_IDLE_ROUNDS_LIMIT = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class ConfigurationTemplatesStore {
  sources: TemplateSourcePublicSchema[] = [];
  isLoading = false;
  hasError = false;

  actionSourceId: string | null = null;
  actionSourceKind: SourceCardAction | null = null;

  templatesStore = new SourceTemplatesStore();

  private pollGeneration = 0;

  constructor() {
    makeAutoObservable(this);
  }

  get sortedSources() {
    return sortSources(this.sources);
  }

  reset = () => {
    this.pollGeneration += 1;
    this.sources = [];
    this.isLoading = false;
    this.hasError = false;
    this.actionSourceId = null;
    this.actionSourceKind = null;
    this.templatesStore.reset();
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

  private createTemplateSource = async (
    schema: TemplateSourceCreateSchema
  ): Promise<TemplateSourcePublicSchema> => {
    const created = await apiCoreStore.taskTemplateSourcesApi?.templateSourceCreate({
      TemplateSourceCreateSchema: schema,
    });

    if (!created) {
      throw new Error("Failed to create template source");
    }

    runInAction(() => this.addSource(created));
    return created;
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
  }): Promise<TemplateSourcePublicSchema> =>
    this.createTemplateSource({
      source_type: SourceType.GitRepo,
      name: payload.name,
      description: payload.description,
      repo_url: payload.repo_url,
      repo_user: payload.repo_user ?? null,
      repo_pass: payload.repo_pass ?? null,
      branch: "master",
    });

  removeSource = (sourceId: string) => {
    this.sources = this.sources.filter((item) => item.id !== sourceId);
  };

  private beginSourceAction = (sourceId: string, kind: SourceCardAction) => {
    runInAction(() => {
      this.actionSourceId = sourceId;
      this.actionSourceKind = kind;
    });
  };

  private endSourceAction = (sourceId: string) => {
    runInAction(() => {
      if (this.actionSourceId === sourceId) {
        this.actionSourceId = null;
        this.actionSourceKind = null;
      }
    });
  };

  private refreshAndApplySource = async (sourceId: string) => {
    const updated = await this.refreshSource(sourceId);
    if (updated) {
      runInAction(() => this.applySourceUpdate(updated));
    }
  };

  private markOptimisticOperation = (sourceId: string, operation: SourceOperation) => {
    const index = this.sources.findIndex((item) => item.id === sourceId);
    if (index === -1) return;

    const source = this.sources[index];
    if (source.current_operation !== null) return;

    this.sources[index] = { ...source, current_operation: operation };
  };

  private pollSourceUntilSettled = async (
    sourceId: string,
    initialState: SourceState,
    generation: number
  ) => {
    let idleUnchangedRounds = 0;

    while (true) {
      if (this.pollGeneration !== generation) return;
      const updated = await this.refreshSource(sourceId);
      if (this.pollGeneration !== generation) return;
      if (!updated) return;

      runInAction(() => this.applySourceUpdate(updated));

      if (updated.state === SourceState.Broken || updated.last_error) {
        return;
      }

      if (updated.current_operation !== null) {
        idleUnchangedRounds = 0;
        await sleep(SOURCE_POLL_INTERVAL_MS);
        continue;
      }

      if (updated.state !== initialState) return;

      idleUnchangedRounds += 1;
      if (idleUnchangedRounds >= SOURCE_POLL_IDLE_ROUNDS_LIMIT) return;

      await sleep(SOURCE_POLL_INTERVAL_MS);
    }
  };

  private refreshAfterSourceAction = async (
    sourceId: string,
    kind: SourceCardAction,
    initialState: SourceState | undefined
  ) => {
    if (kind === "plug") {
      runInAction(() => this.markOptimisticOperation(sourceId, SourceOperation.PrepareFiles));
    } else if (kind === "sync") {
      runInAction(() => this.markOptimisticOperation(sourceId, SourceOperation.PrepareSls));
    }

    if (initialState !== undefined) {
      const generation = this.pollGeneration;
      await this.pollSourceUntilSettled(sourceId, initialState, generation);
      return;
    }

    await this.refreshAndApplySource(sourceId);
  };

  private runSourceAction = async (
    sourceId: string,
    kind: SourceCardAction,
    mutate: () => Promise<unknown>,
    options?: { refresh?: boolean; remove?: boolean }
  ) => {
    const initialState = this.sources.find((item) => item.id === sourceId)?.state;

    this.beginSourceAction(sourceId, kind);

    try {
      await mutate();

      if (options?.remove) {
        runInAction(() => this.removeSource(sourceId));
      } else if (options?.refresh !== false) {
        await this.refreshAfterSourceAction(sourceId, kind, initialState);
      }
    } finally {
      this.endSourceAction(sourceId);
    }
  };

  plugSource = async (sourceId: string) => {
    await this.runSourceAction(sourceId, "plug", () =>
      apiCoreStore.taskTemplateSourcesApi?.templateSourcePlug({ source_id: sourceId })
    );
  };

  syncSource = async (sourceId: string) => {
    await this.runSourceAction(sourceId, "sync", () =>
      apiCoreStore.taskTemplateSourcesApi?.templateSourceSync({
        source_id: sourceId,
        request_body: this.templatesStore.getTemplateIds(sourceId),
      })
    );
  };

  deleteSource = async (sourceId: string) => {
    await this.runSourceAction(
      sourceId,
      "delete",
      () => apiCoreStore.taskTemplateSourcesApi?.templateSourceDelete({ source_id: sourceId }),
      { refresh: false, remove: true }
    );
  };
}
