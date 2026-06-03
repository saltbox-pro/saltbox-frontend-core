import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export interface SourceTemplatesState {
  items: TaskTemplatePublicSchema[];
  isLoading: boolean;
  hasError: boolean;
}

const createInitialState = (): SourceTemplatesState => ({
  items: [],
  isLoading: false,
  hasError: false,
});

export class SourceTemplatesStore {
  bySourceId = new Map<string, SourceTemplatesState>();

  constructor() {
    makeAutoObservable(this);
  }

  reset = () => {
    this.bySourceId.clear();
  };

  getState = (sourceId: string): SourceTemplatesState => {
    const key = String(sourceId);
    const existing = this.bySourceId.get(key);
    if (existing) return existing;

    const created = observable(createInitialState());
    this.bySourceId.set(key, created);
    return created;
  };

  loadAll = async (sourceId: string) => {
    const key = String(sourceId);
    const state = this.getState(key);
    if (state.isLoading) return;

    runInAction(() => {
      state.items = [];
      state.hasError = false;
      state.isLoading = true;
    });

    try {
      const response = await apiCoreStore.newTaskTemplatesApi?.newTemplateList({
        SaltboxCoreTaskTemplatesSchemasTemplateTaskTemplateListBody: {
          query: { source_id: key },
        },
      });

      runInAction(() => {
        state.items = response?.data ?? [];
      });
    } catch (error) {
      console.error("Failed to load source templates:", error);
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
}
