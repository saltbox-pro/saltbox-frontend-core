import type { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export interface RepoTemplatesState {
  items: TaskTemplateShortSchema[];
  total: number | null;
  skip: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  isLoadedOnce: boolean;
}

const createInitialState = (): RepoTemplatesState => ({
  items: [],
  total: null,
  skip: 0,
  limit: 25,
  isLoading: false,
  error: null,
  isLoadedOnce: false,
});

export class ConnectedTemplatesStore {
  byRepoId = new Map<string, RepoTemplatesState>();

  constructor() {
    makeAutoObservable(this);
  }

  reset = () => {
    this.byRepoId.clear();
  };

  getState = (repoId: string): RepoTemplatesState => {
    const key = String(repoId);
    const existing = this.byRepoId.get(key);
    if (existing) return existing;

    const created = createInitialState();
    this.byRepoId.set(key, created);
    return created;
  };

  hasMore = (repoId: string): boolean => {
    const state = this.getState(repoId);
    return state.total === null ? true : state.items.length < state.total;
  };

  loadFirstPage = async (repoId: string) => {
    const key = String(repoId);
    const state = this.getState(key);
    if (state.isLoading || state.isLoadedOnce) return;

    runInAction(() => {
      state.items = [];
      state.total = null;
      state.skip = 0;
      state.error = null;
      state.isLoading = true;
    });

    await apiCoreStore.taskTemplatesApi
      ?.taskTemplatesList({
        SaltboxCoreTasksSchemasTasksTemplateTaskTemplateListBody: {
          repo_ids: [key],
          limit: state.limit,
          skip: 0,
        },
      })
      .then((response) => {
        runInAction(() => {
          state.items = response.data ?? [];
          state.total = (response.total as number) ?? 0;
          state.skip = state.items.length;
          state.isLoadedOnce = true;
        });
      })
      .catch((error) => {
        console.error("Failed to load repo templates:", error);
        runInAction(() => {
          state.error = "Failed to load templates";
        });
      })
      .finally(() => {
        runInAction(() => {
          state.isLoading = false;
        });
      });
  };

  loadMore = async (repoId: string) => {
    const key = String(repoId);
    const state = this.getState(key);
    if (state.isLoading) return;
    if (state.total !== null && state.items.length >= state.total) return;

    runInAction(() => {
      state.error = null;
      state.isLoading = true;
    });

    const skip = state.skip;
    const limit = state.limit;

    await apiCoreStore.taskTemplatesApi
      ?.taskTemplatesList({
        SaltboxCoreTasksSchemasTasksTemplateTaskTemplateListBody: {
          repo_ids: [key],
          limit,
          skip,
        },
      })
      .then((response) => {
        runInAction(() => {
          const next = response.data ?? [];
          state.items = [...state.items, ...next];
          state.total = (response.total as number) ?? 0;
          state.skip = state.items.length;
          state.isLoadedOnce = true;
        });
      })
      .catch((error) => {
        console.error("Failed to load more repo templates:", error);
        runInAction(() => {
          state.error = "Failed to load templates";
        });
      })
      .finally(() => {
        runInAction(() => {
          state.isLoading = false;
        });
      });
  };
}
