import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class MinionStore {
  mid: string;
  slug: string;
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  error: string | null;

  constructor(slug: string, minionId: string, options?: { initialMinion?: MinionDetailSchema }) {
    makeAutoObservable(this);

    this.slug = slug;
    this.mid = minionId;
    this.isMinionLoading = false;
    this.minion = null;
    this.error = null;

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
    this.error = null;
    apiCoreStore.minionsApi
      ?.minionGet({
        collection_slug: this.slug,
        mid: this.mid,
      })
      .then((minion) => {
        this.minion = minion;
      })
      .catch((error) => {
        console.error("Error loading minion:", error);
        this.error = "Failed to load minion";
      })
      .finally(() => {
        this.isMinionLoading = false;
      });
  };
}
