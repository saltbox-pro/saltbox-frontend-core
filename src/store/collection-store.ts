import { makeAutoObservable, runInAction } from "mobx";
import { CollectionDetailSchema } from "saltbox-core-api";
import { apiStore } from "saltbox-core/store";

export class CollectionStore {
  isLoading: boolean;
  collection: CollectionDetailSchema | undefined;
  collectionSlug: string | undefined;
  isDeleted: boolean;
  isCollectionLoading: boolean;
  error: string | null;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.isDeleted = false;
    this.isCollectionLoading = false;
    this.error = null;
    this.loadCollection();
  }

  loadCollection = () => {
    if (this.collectionSlug) {
      this.isLoading = true;
      this.error = null;
      apiStore.minionCollectionsApi
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
    this.loadCollection();
  };

  updateCollectionQuery = async (query: object) => {
    if (!this.collectionSlug || !this.collection) return;

    this.isLoading = true;
    try {
      const updatedCollection =
        await apiStore.minionCollectionsApi?.minionCollectionUpdate({
          slug: this.collectionSlug,
          CollectionUpdateSchema: {
            title: this.collection.title,
            query: query,
          },
        });

      runInAction(() => {
        this.collection = updatedCollection;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  updateCollectionTitle = async (title: string) => {
    if (!this.collectionSlug || !this.collection) return;

    this.isLoading = true;
    try {
      const updatedCollection =
        await apiStore.minionCollectionsApi?.minionCollectionUpdate({
          slug: this.collectionSlug,
          CollectionUpdateSchema: {
            query: this.collection.query,
            title: title,
          },
        });

      runInAction(() => {
        this.collection = updatedCollection;
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
      await apiStore.minionCollectionsApi?.minionCollectionDelete({
        slug: this.collectionSlug,
      });

      runInAction(() => {
        this.isDeleted = true;
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
