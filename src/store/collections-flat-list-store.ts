import type { CollectionFlatListItemSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class CollectionsFlatListStore {
  items: CollectionFlatListItemSchema[] = [];

  readonly itemsLoad = createLoader({
    run: () =>
      apiCoreStore.minionCollectionsApi?.minionCollectionsFlatList({ CollectionFlatListBody: {} }),
    onSuccess: (items) => {
      this.items = items ?? [];
    },
  });

  constructor() {
    makeAutoObservable(this, { itemsLoad: false });
  }

  get isLoaded(): boolean {
    return this.itemsLoad.status === "success";
  }

  load = () => {
    if (this.isLoaded || this.itemsLoad.isLoading) return;

    this.itemsLoad.run().catch(() => undefined);
  };

  reload = () => {
    if (this.itemsLoad.status === "idle") return;

    this.itemsLoad.run().catch(() => undefined);
  };
}

export const collectionsFlatListStore = new CollectionsFlatListStore();
