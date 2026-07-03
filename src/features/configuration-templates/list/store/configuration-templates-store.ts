import { SourceOperation, type SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import {
  isBgTaskPollAborted,
  rethrowIfAborted,
} from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { sortSources } from "saltbox-core/shared/helpers/sort-sources";
import { apiCoreStore } from "saltbox-core/store";

import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
import { isApiNotFoundError } from "../../shared/helpers/is-api-not-found-error";
import { hasConnectedLocalTemplateSource } from "../../shared/helpers/is-connected-local-template-source";
import {
  mergeSourceListItemUpdate,
  normalizeSourceListItem,
} from "../../shared/helpers/normalize-source-list-item";
import { waitForBgTask } from "../../shared/helpers/wait-for-bg-task";
import { fetchTemplateSource } from "../../shared/service/fetch-template-source.service";
import { TemplateSourceRuntime } from "../../shared/service/template-source-runtime";
import type { RefreshSourceResult } from "../../shared/types/refresh-source-result";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { SourceActionKind, SourceActionsPort } from "../../shared/types/source-action";
import type { TemplateSourceStatePort } from "../../shared/types/template-source-state-port";
import {
  getGitlabSyncErrorDetail,
  resolveGitlabSyncErrorKind,
  type GitlabSyncErrorKind,
} from "../helpers/gitlab-sync-error";
import { syncGitlabSources } from "../service/sync-gitlab-sources.service";

type LoadOptions = {
  signal?: AbortSignal;
  isCancelled?: () => boolean;
};

export type ConfigurationTemplatesListStore = SourceActionsPort & {
  sources: SourceListWithExtrasSchema[];
  readonly hasConnectedLocalSource: boolean;
  load: (options?: LoadOptions) => Promise<void>;
  refreshWithExternalCheck: () => Promise<boolean>;
  reloadSource: (sourceId: string) => Promise<void>;
  addSourceFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
  deleteSourceFile: (sourceId: string, fileId: string) => Promise<ResourceDeleteResult>;
  deleteSourceTemplate: (sourceId: string, templateId: string) => Promise<void>;
};

export class ConfigurationTemplatesStore implements ConfigurationTemplatesListStore {
  sources: SourceListWithExtrasSchema[] = [];
  isLoading = false;
  isCheckingExternal = false;
  hasLoadedOnce = false;
  hasError = false;
  gitlabSyncError: GitlabSyncErrorKind | null = null;
  gitlabSyncErrorDetail: string | null = null;

  actionBySourceId = new Map<string, SourceActionKind>();

  private readonly runtime: TemplateSourceRuntime;
  private externalCheckAbortController: AbortController | null = null;
  private externalCheckGeneration = 0;
  private loadAbortController: AbortController | null = null;
  private loadGeneration = 0;

  constructor() {
    makeAutoObservable(this);

    this.runtime = new TemplateSourceRuntime(this.createStatePort());
  }

  get sortedSources() {
    return sortSources(this.sources);
  }

  get hasConnectedLocalSource() {
    return hasConnectedLocalTemplateSource(this.sources);
  }

  reset = () => {
    this.cancelExternalCheck();
    this.cancelLoad();
    this.runtime.reset();
    this.sources = [];
    this.isLoading = false;
    this.isCheckingExternal = false;
    this.hasLoadedOnce = false;
    this.hasError = false;
    this.gitlabSyncError = null;
    this.gitlabSyncErrorDetail = null;
  };

  private cancelExternalCheck = () => {
    this.externalCheckAbortController?.abort();
    this.externalCheckAbortController = null;
    this.externalCheckGeneration += 1;
  };

  private cancelLoad = () => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;
    this.loadGeneration += 1;
  };

  private createStatePort(): TemplateSourceStatePort {
    return {
      actionBySourceId: this.actionBySourceId,
      isSourcePresent: (sourceId) => this.sources.some((item) => item.id === sourceId),
      patchOptimisticTask: (sourceId, operation, taskId) =>
        this.patchOptimisticTask(sourceId, operation, taskId),
      removeSource: (sourceId) => this.removeSourceFromList(sourceId),
      reloadSource: (sourceId) => this.reloadSource(sourceId),
      getSource: (sourceId) => this.sources.find((item) => item.id === sourceId),
    };
  }

  private fetchSources = async (signal?: AbortSignal): Promise<SourceListWithExtrasSchema[]> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) {
      throw new Error("API is not configured");
    }

    try {
      const response = await api.templateSourceList(
        { TemplateSourceListBody: {} },
        signal ? { signal } : undefined
      );

      return (response.data ?? []).map(normalizeSourceListItem);
    } catch (error) {
      rethrowIfAborted(error, signal);
      throw error;
    }
  };

  load = async (options?: LoadOptions) => {
    const ownsAbort = !options?.signal;

    if (ownsAbort) {
      this.cancelLoad();
    }

    const generation = ownsAbort ? this.loadGeneration : undefined;
    const abortController = ownsAbort ? new AbortController() : null;

    if (ownsAbort && abortController) {
      this.loadAbortController = abortController;
    }

    const signal = options?.signal ?? abortController?.signal;
    const isCancelled =
      options?.isCancelled ??
      (generation !== undefined ? () => generation !== this.loadGeneration : () => false);

    runInAction(() => {
      this.isLoading = true;
      this.hasError = false;
    });

    try {
      const sources = await this.fetchSources(signal);

      if (isCancelled()) return;

      runInAction(() => {
        this.sources = this.mergeSourcesPreservingActiveTasks(sources);
      });
      this.runtime.syncForSources(this.sources);
    } catch (reason) {
      if (isBgTaskPollAborted(reason) || isCancelled()) return;

      console.error("Failed to load template sources:", reason);
      runInAction(() => {
        if (isGlobalServerError(reason)) return;
        this.hasError = true;
        if (!this.hasLoadedOnce) {
          this.sources = [];
        }
      });
    } finally {
      const cancelled = isCancelled();

      runInAction(() => {
        this.isLoading = false;
        if (!cancelled) {
          this.hasLoadedOnce = true;
        }
      });

      if (ownsAbort && generation === this.loadGeneration) {
        this.loadAbortController = null;
      }
    }
  };

  refreshWithExternalCheck = async (): Promise<boolean> => {
    if (this.isCheckingExternal) return false;

    runInAction(() => {
      this.isCheckingExternal = true;
      this.hasError = false;
      this.gitlabSyncError = null;
      this.gitlabSyncErrorDetail = null;
    });

    this.cancelExternalCheck();

    const generation = this.externalCheckGeneration;
    const abortController = new AbortController();
    this.externalCheckAbortController = abortController;

    try {
      await syncGitlabSources({
        signal: abortController.signal,
        isCancelled: () => generation !== this.externalCheckGeneration,
      });

      if (generation !== this.externalCheckGeneration) return false;

      await this.load({
        signal: abortController.signal,
        isCancelled: () => generation !== this.externalCheckGeneration,
      });

      if (generation !== this.externalCheckGeneration) return false;

      return true;
    } catch (reason) {
      if (isBgTaskPollAborted(reason) || generation !== this.externalCheckGeneration) return false;

      console.error("Failed to check external template sources:", reason);
      if (isGlobalServerError(reason)) return false;

      runInAction(() => {
        this.gitlabSyncError = resolveGitlabSyncErrorKind(reason);
        this.gitlabSyncErrorDetail = getGitlabSyncErrorDetail(reason);
      });

      return false;
    } finally {
      if (generation === this.externalCheckGeneration) {
        runInAction(() => {
          this.isCheckingExternal = false;
        });
        this.externalCheckAbortController = null;
      }
    }
  };

  reloadSource = async (sourceId: string): Promise<void> => {
    try {
      const refreshResult = await this.refreshSource(sourceId);
      if (refreshResult.status !== "found") return;

      runInAction(() => {
        const index = this.sources.findIndex((item) => item.id === sourceId);
        if (index === -1) return;

        this.sources[index] = mergeSourceListItemUpdate(this.sources[index], refreshResult.source);
      });
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to reload template source:", reason);
    }
  };

  refreshSource = async (sourceId: string): Promise<RefreshSourceResult> => {
    try {
      const source = await fetchTemplateSource(sourceId);
      return source ? { status: "found", source } : { status: "not_found" };
    } catch (reason) {
      if (isApiNotFoundError(reason)) return { status: "not_found" };
      if (isGlobalServerError(reason)) return { status: "failed" };
      console.error("Failed to refresh template source:", reason);
      return { status: "failed" };
    }
  };

  private runSourceCreateTask = async (
    create: () => Promise<{ task_id: string }>
  ): Promise<void> => {
    const taskId = extractTaskId(await create());
    await waitForBgTask(taskId);
    await this.load();
  };

  createLocalSource = async (payload: {
    name: string;
    description?: string;
    namespace?: string;
  }): Promise<void> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");

    await this.runSourceCreateTask(() =>
      api.templateSourceCreateLocal({
        TemplateSourceCreateLocalSchema: {
          name: payload.name,
          description: payload.description,
          namespace: payload.namespace,
        },
      })
    );
  };

  createGitSource = async (payload: {
    name: string;
    description?: string;
    namespace?: string;
    repo_url: string;
    repo_user?: string;
    repo_pass?: string;
    branch?: string;
  }): Promise<void> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");

    await this.runSourceCreateTask(() =>
      api.templateSourceImportFromGit({
        TemplateSourceImportFromGitSchema: {
          name: payload.name,
          description: payload.description,
          namespace: payload.namespace,
          repo_url: payload.repo_url,
          repo_user: payload.repo_user,
          repo_pass: payload.repo_pass,
          branch: payload.branch,
        },
      })
    );
  };

  createArchiveSource = async (payload: {
    name: string;
    description?: string;
    namespace?: string;
    file: File;
  }): Promise<void> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");

    await this.runSourceCreateTask(() =>
      api.templateSourceImportFromArchive({
        name: payload.name,
        description: payload.description ?? "",
        namespace: payload.namespace,
        file: payload.file,
      })
    );
  };

  private mergeSourcesPreservingActiveTasks = (
    incoming: SourceListWithExtrasSchema[]
  ): SourceListWithExtrasSchema[] => {
    return incoming.map((source) => {
      const existing = this.sources.find((item) => item.id === source.id);
      if (!existing) return source;

      const hasActiveClientAction = this.actionBySourceId.has(source.id);
      const hasStaleServerTaskFields = Boolean(existing.current_task_id) && !source.current_task_id;

      if (!hasActiveClientAction && !hasStaleServerTaskFields) {
        return source;
      }

      if (!existing.current_task_id && !existing.current_operation) {
        return source;
      }

      return {
        ...source,
        current_operation: existing.current_operation ?? source.current_operation,
        current_task_id: existing.current_task_id,
        last_error: existing.last_error,
      };
    });
  };

  private removeSourceFromList = (sourceId: string) => {
    this.sources = this.sources.filter((item) => item.id !== sourceId);
  };

  private patchOptimisticTask = (sourceId: string, operation: SourceOperation, taskId: string) => {
    const index = this.sources.findIndex((item) => item.id === sourceId);
    if (index === -1) return;

    this.sources[index] = {
      ...this.sources[index],
      current_operation: operation,
      current_task_id: taskId,
      last_error: null,
    };
  };

  addSourceFile = (sourceId: string, payload: AddSourceFilePayload): Promise<void> =>
    this.runtime.addSourceFile(sourceId, payload);

  deleteSourceFile = (sourceId: string, fileId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSourceFile(sourceId, fileId);

  plugSource = (sourceId: string): Promise<void> => this.runtime.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.runtime.syncSource(sourceId);

  unplugSource = (sourceId: string): Promise<void> => this.runtime.unplugSource(sourceId);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSource(sourceId);

  deleteSourceTemplate = (sourceId: string, templateId: string): Promise<void> =>
    this.runtime.deleteSourceTemplate(sourceId, templateId);
}
