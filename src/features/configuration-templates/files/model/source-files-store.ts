import type { SshfsFilePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import { isApiNotFoundError } from "../../shared/helpers/is-api-not-found-error";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { AddSourceFilePayload } from "../types/source-file-payload";

export interface SourceFilesState {
  items: SshfsFilePublicSchema[];
  isLoading: boolean;
  hasError: boolean;
}

const createInitialState = (): SourceFilesState => ({
  items: [],
  isLoading: false,
  hasError: false,
});

export class SourceFilesStore {
  bySourceId = new Map<string, SourceFilesState>();

  constructor() {
    makeAutoObservable(this);
  }

  reset = () => {
    this.bySourceId.clear();
  };

  getState = (sourceId: string): SourceFilesState => {
    const key = String(sourceId);
    const existing = this.bySourceId.get(key);
    if (existing) return existing;

    const created = observable(createInitialState());
    this.bySourceId.set(key, created);
    return created;
  };

  loadAll = async (sourceId: string, options?: { force?: boolean }) => {
    const key = String(sourceId);
    const state = this.getState(key);
    if (state.isLoading && !options?.force) return;

    runInAction(() => {
      state.hasError = false;
      state.isLoading = true;
    });

    try {
      const items = await apiCoreStore.templateSourceFilesApi?.sshfsFileList({
        source_id: key,
      });

      runInAction(() => {
        state.items = items ?? [];
      });
    } catch (error) {
      console.error("Failed to load source files:", error);
      runInAction(() => {
        if (!isGlobalServerError(error)) {
          state.hasError = true;
        }
      });
    } finally {
      runInAction(() => {
        state.isLoading = false;
      });
    }
  };

  addFile = async (sourceId: string, payload: AddSourceFilePayload) => {
    const key = String(sourceId);
    const api = apiCoreStore.templateSourceFilesApi;
    if (!api) {
      throw new Error("API is not configured");
    }

    await api.sshfsFileAdd({
      source_id: key,
      rel_path: payload.rel_path,
      file: payload.file ?? undefined,
      url: payload.url ?? undefined,
      unpack_as: payload.unpack_as ?? undefined,
    });
  };

  deleteFile = async (sourceId: string, fileId: string): Promise<ResourceDeleteResult> => {
    const key = String(sourceId);
    const api = apiCoreStore.templateSourceFilesApi;
    if (!api) {
      throw new Error("API is not configured");
    }

    let result: ResourceDeleteResult = "deleted";

    try {
      await api.deleteSourceFile({
        source_id: key,
        file_id: fileId,
      });
    } catch (error) {
      if (isApiNotFoundError(error)) {
        result = "not_found";
      } else {
        throw error;
      }
    }

    runInAction(() => {
      const state = this.getState(key);
      state.items = state.items.filter((item) => item.id !== fileId);
    });

    return result;
  };
}
