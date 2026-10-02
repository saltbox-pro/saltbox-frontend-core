import { SourceOperation, type SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { rethrowIfAborted } from "saltbox-core/shared/errors/bg-task-poll-aborted.error";
import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { isApiNotFoundError } from "saltbox-core/shared/helpers/is-api-not-found-error";
import { sortSources } from "saltbox-core/shared/helpers/sort-sources";
import { apiCoreStore } from "saltbox-core/store";

import type { AddSourceFilePayload } from "../../files/types/source-file-payload";
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
import type { UpdateTemplateSourcePayload } from "../../shared/types/update-template-source";
import { refreshWithSyncCheck } from "../service/refresh-with-sync-check.service";
import { syncGitlabSources } from "../service/sync-gitlab-sources.service";
import { syncMountedSources } from "../service/sync-mounted-sources.service";

export type ConfigurationTemplatesListStore = SourceActionsPort & {
  sources: SourceListWithExtrasSchema[];
  readonly hasConnectedLocalSource: boolean;
  load: (signal?: AbortSignal) => Promise<void>;
  refreshWithExternalCheck: () => Promise<void>;
  reloadSource: (sourceId: string) => Promise<void>;
  addSourceFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
  deleteSourceFile: (sourceId: string, fileId: string) => Promise<ResourceDeleteResult>;
  deleteSourceTemplate: (sourceId: string, templateId: string) => Promise<void>;
};

export class ConfigurationTemplatesStore implements ConfigurationTemplatesListStore {
  sources: SourceListWithExtrasSchema[] = [];
  isCheckingExternal = false;
  isCheckingMounted = false;
  hasLoadedOnce = false;

  actionBySourceId = new Map<string, SourceActionKind>();

  readonly sourcesLoad = createLoader({
    run: (signal?: AbortSignal) => this.fetchSources(signal),
    onSuccess: (sources) => {
      this.sources = this.mergeSourcesPreservingActiveTasks(sources);
      this.hasLoadedOnce = true;
      this.runtime.syncForSources(this.sources);
    },
  });

  private readonly runtime: TemplateSourceRuntime;
  private externalCheckAbortController: AbortController | null = null;
  private externalCheckGeneration = 0;
  private mountedCheckAbortController: AbortController | null = null;
  private mountedCheckGeneration = 0;
  private loadAbortController: AbortController | null = null;

  constructor() {
    makeAutoObservable(this, { sourcesLoad: false });

    this.runtime = new TemplateSourceRuntime(this.createStatePort());
  }

  get isLoading() {
    return this.sourcesLoad.isLoading;
  }

  get sortedSources() {
    return sortSources(this.sources);
  }

  get hasConnectedLocalSource() {
    return hasConnectedLocalTemplateSource(this.sources);
  }

  reset = () => {
    this.cancelExternalCheck();
    this.cancelMountedCheck();
    this.cancelLoad();
    this.runtime.reset();
    this.sources = [];
    this.isCheckingExternal = false;
    this.isCheckingMounted = false;
    this.hasLoadedOnce = false;
  };

  private cancelExternalCheck = (): number => {
    this.externalCheckAbortController?.abort();
    this.externalCheckAbortController = null;
    this.externalCheckGeneration += 1;
    return this.externalCheckGeneration;
  };

  private cancelMountedCheck = (): number => {
    this.mountedCheckAbortController?.abort();
    this.mountedCheckAbortController = null;
    this.mountedCheckGeneration += 1;
    return this.mountedCheckGeneration;
  };

  private cancelLoad = () => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;
  };

  private createStatePort(): TemplateSourceStatePort {
    return {
      actionBySourceId: this.actionBySourceId,
      isSourcePresent: (sourceId) => this.sources.some((item) => item.id === sourceId),
      patchOptimisticTask: (sourceId, operation, taskId) =>
        this.patchOptimisticTask(sourceId, operation, taskId),
      applySourceMetadataUpdate: (sourceId, updated) => {
        this.sources = this.sources.map((item) =>
          item.id === sourceId ? mergeSourceListItemUpdate(item, updated) : item
        );
      },
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

  /** Без внешнего signal заводит свой: `reset()` обрывает загрузку при размонтировании. */
  load = (signal?: AbortSignal): Promise<void> => {
    if (signal) {
      return this.sourcesLoad.run(signal);
    }

    this.cancelLoad();
    const abortController = new AbortController();
    this.loadAbortController = abortController;

    return this.sourcesLoad.run(abortController.signal);
  };

  refreshWithExternalCheck = (): Promise<void> =>
    refreshWithSyncCheck({
      isAlreadyChecking: () => this.isCheckingExternal,
      start: () => {
        runInAction(() => {
          this.isCheckingExternal = true;
        });
      },
      cancel: () => this.cancelExternalCheck(),
      setAbortController: (controller) => {
        this.externalCheckAbortController = controller;
      },
      isStale: (generation) => generation !== this.externalCheckGeneration,
      sync: (deps) => syncGitlabSources(deps),
      load: (signal) => this.load(signal),
      finish: (generation) => {
        if (generation !== this.externalCheckGeneration) return;

        runInAction(() => {
          this.isCheckingExternal = false;
        });
        this.externalCheckAbortController = null;
      },
    });

  refreshWithMountedCheck = (): Promise<void> =>
    refreshWithSyncCheck({
      isAlreadyChecking: () => this.isCheckingMounted,
      start: () => {
        runInAction(() => {
          this.isCheckingMounted = true;
        });
      },
      cancel: () => this.cancelMountedCheck(),
      setAbortController: (controller) => {
        this.mountedCheckAbortController = controller;
      },
      isStale: (generation) => generation !== this.mountedCheckGeneration,
      sync: (deps) => syncMountedSources(deps),
      load: (signal) => this.load(signal),
      finish: (generation) => {
        if (generation !== this.mountedCheckGeneration) return;

        runInAction(() => {
          this.isCheckingMounted = false;
        });
        this.mountedCheckAbortController = null;
      },
    });

  reloadSource = async (sourceId: string): Promise<void> => {
    const refreshResult = await this.refreshSource(sourceId);
    if (refreshResult.status !== "found") return;

    runInAction(() => {
      this.sources = this.sources.map((item) =>
        item.id === sourceId ? mergeSourceListItemUpdate(item, refreshResult.source) : item
      );
    });
  };

  refreshSource = async (sourceId: string): Promise<RefreshSourceResult> => {
    try {
      const source = await fetchTemplateSource(sourceId);
      return source ? { status: "found", source } : { status: "not_found" };
    } catch (reason) {
      if (isApiNotFoundError(reason)) return { status: "not_found" };
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
    namespace: string;
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
    file: File;
  }): Promise<void> => {
    const api = apiCoreStore.taskTemplateSourcesApi;
    if (!api) throw new Error("API is not configured");

    await this.runSourceCreateTask(() =>
      api.templateSourceImportFromArchive({
        name: payload.name,
        description: payload.description ?? "",
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
    this.sources = this.sources.map((item) =>
      item.id === sourceId
        ? {
            ...item,
            current_operation: operation,
            current_task_id: taskId,
            last_error: null,
          }
        : item
    );
  };

  addSourceFile = (sourceId: string, payload: AddSourceFilePayload): Promise<void> =>
    this.runtime.addSourceFile(sourceId, payload);

  deleteSourceFile = (sourceId: string, fileId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSourceFile(sourceId, fileId);

  plugSource = (sourceId: string): Promise<void> => this.runtime.plugSource(sourceId);

  syncSource = (sourceId: string): Promise<void> => this.runtime.syncSource(sourceId);

  unplugSource = (sourceId: string): Promise<void> => this.runtime.unplugSource(sourceId);

  updateSource = (sourceId: string, payload: UpdateTemplateSourcePayload) =>
    this.runtime.updateSource(sourceId, payload);

  deleteSource = (sourceId: string): Promise<ResourceDeleteResult> =>
    this.runtime.deleteSource(sourceId);

  deleteSourceTemplate = (sourceId: string, templateId: string): Promise<void> =>
    this.runtime.deleteSourceTemplate(sourceId, templateId);
}
