import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { createResourceLoadError, type ResourceLoadError } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class MinionStore {
  mid: string;
  slug: string;
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  loadError: ResourceLoadError | null;

  constructor(slug: string, minionId: string, options?: { initialMinion?: MinionDetailSchema }) {
    makeAutoObservable(this);

    this.slug = slug;
    this.mid = minionId;
    this.isMinionLoading = false;
    this.minion = null;
    this.loadError = null;

    if (options?.initialMinion) {
      this.minion = options.initialMinion;
      return;
    }

    this.loadMinion();
  }

  loadMinion = () => {
    if (this.mid.length === 0) {
      return;
    }
    this.isMinionLoading = true;
    this.loadError = null;
    apiCoreStore.minionsApi
      ?.minionGet({
        collection_slug: this.slug,
        mid: this.mid,
      })
      .then((minion) => {
        runInAction(() => {
          this.minion = minion;
        });
      })
      .catch((error) => {
        console.error("Error loading minion:", error);
        runInAction(() => {
          this.loadError = createResourceLoadError(error);
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isMinionLoading = false;
        });
      });
  };
}
