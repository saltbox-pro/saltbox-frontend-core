import { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore, collectionsTreeStore } from "saltbox-core/store";

export class CollectionStore {
  isSaving: boolean;
  collection: CollectionDetailSchema | undefined;
  collectionSlug: string | undefined;

  readonly collectionLoad = createLoader({
    run: () =>
      this.collectionSlug
        ? apiCoreStore.minionCollectionsApi?.minionCollectionRead({
            slug: this.collectionSlug,
          })
        : undefined,
    onSuccess: (collection) => {
      this.collection = collection;
    },
  });

  constructor() {
    makeAutoObservable(this, { collectionLoad: false });
    this.isSaving = false;
    this.loadCollection();
  }

  get isLoading(): boolean {
    return this.collectionLoad.isLoading || this.isSaving;
  }

  loadCollection = () => {
    if (!this.collectionSlug) return;
    this.collectionLoad.run().catch(() => undefined);
  };

  setCollectionSlug = (collectionSlug: string) => {
    this.collectionSlug = collectionSlug;
    this.collection = undefined;
    this.loadCollection();
  };

  reset = (): void => {
    this.collectionLoad.resetInitial();
    this.collection = undefined;
    this.collectionSlug = undefined;
  };

  updateCollection = async (payload: { title?: string; description?: string; query?: object }) => {
    if (!this.collectionSlug || !this.collection) return;

    const oldSlug = this.collectionSlug;

    this.isSaving = true;
    try {
      const updatedCollection = await apiCoreStore.minionCollectionsApi?.minionCollectionUpdate({
        slug: oldSlug,
        CollectionUpdateSchema: {
          title: payload.title ?? this.collection.title,
          query: payload.query ?? this.collection.query,
          description: payload.description ?? this.collection.description ?? "",
        },
      });

      runInAction(() => {
        this.collection = updatedCollection;
        if (updatedCollection) {
          collectionsTreeStore.updateNode(oldSlug, {
            title: updatedCollection.title,
            slug: updatedCollection.slug,
            description: updatedCollection.description,
          });
          this.collectionSlug = updatedCollection.slug;
        }
      });
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  deleteCollection = async () => {
    if (!this.collectionSlug) return;

    this.isSaving = true;
    try {
      await apiCoreStore.minionCollectionsApi?.minionCollectionDelete({
        slug: this.collectionSlug,
      });

      runInAction(() => {
        this.collection = undefined;
        this.collectionSlug = undefined;
      });
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };
}
