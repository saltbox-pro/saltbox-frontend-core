import { autorun, makeAutoObservable } from 'mobx';
import { CollectionDetailSchema } from 'saltbox-core-api';
import { apiStore } from './api-store';

export class DefaultCollectionStore {
  isLoading = false;
  error: string | null = null;
  defaultCollection: CollectionDetailSchema | undefined;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchDefaultCollection() {
    if (!apiStore.minionCollectionsApi) return;

    this.isLoading = true;
    this.error = null;

    try {
      this.defaultCollection =
        await apiStore.minionCollectionsApi.minionCollectionDefault();
    } catch (err) {
      this.error =
        err instanceof Error
          ? err.message
          : 'Failed to fetch default collection';
    } finally {
      this.isLoading = false;
    }
  }
}

autorun(() => {
  if (
    !apiStore.minionCollectionsApi ||
    defaultCollectionStore.defaultCollection
  )
    return;
  defaultCollectionStore.fetchDefaultCollection();
});

export const defaultCollectionStore = new DefaultCollectionStore();
