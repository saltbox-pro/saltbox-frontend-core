import { CollectionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore, collectionsTreeStore } from "saltbox-core/store";

export class CollectionStore {
  isLoading: boolean;
  collection: CollectionDetailSchema | undefined;
  collectionSlug: string | undefined;
  isCollectionLoading: boolean;
  error: string | null;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.isCollectionLoading = false;
    this.error = null;
    this.loadCollection();
  }

  loadCollection = () => {
    if (this.collectionSlug) {
      this.isLoading = true;
      this.error = null;
      apiCoreStore.minionCollectionsApi
        ?.minionCollectionRead({
          slug: this.collectionSlug,
        })
        .then((collection) => {
          runInAction(() => {
            this.collection = collection;
          });
        })
        .catch((error) => {
          console.error("Error loading collection:", error);
          runInAction(() => {
            this.error = "Failed to load collection";
          });
        })
        .finally(() => {
          runInAction(() => {
            this.isLoading = false;
          });
        });
    }
  };

  setCollectionSlug = (collectionSlug: string) => {
    this.collectionSlug = collectionSlug;
    this.collection = undefined;
    this.loadCollection();
  };

  updateCollection = async (payload: { title?: string; description?: string; query?: object }) => {
    if (!this.collectionSlug || !this.collection) return;

    const oldSlug = this.collectionSlug;

    this.isLoading = true;
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
        this.isLoading = false;
      });
    }
  };

  deleteCollection = async () => {
    if (!this.collectionSlug) return;

    this.isLoading = true;
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
        this.isLoading = false;
      });
    }
  };
}
