import { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { autorun, makeAutoObservable } from "mobx";

import { apiCoreStore } from "./api-core-store";

export class DefaultCollectionStore {
  isLoading = false;
  error: string | null = null;
  defaultCollection: CollectionDetailSchema | undefined;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchDefaultCollection() {
    if (!apiCoreStore.minionCollectionsApi) return;

    this.isLoading = true;
    this.error = null;

    try {
      //  this.defaultCollection =
      //    await apiCoreStore.minionCollectionsApi.minionCollectionDefault();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to fetch default collection";
    } finally {
      this.isLoading = false;
    }
  }
}

autorun(() => {
  if (!apiCoreStore.minionCollectionsApi || defaultCollectionStore.defaultCollection) return;
  defaultCollectionStore.fetchDefaultCollection();
});

export const defaultCollectionStore = new DefaultCollectionStore();
