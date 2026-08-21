import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { isAbortError } from "saltbox-core/shared/helpers/is-abort-error";
import { apiCoreStore } from "saltbox-core/store";

export class MinionStore {
  mid: string;
  slug: string;
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  error: string | null;
  private loadGeneration = 0;
  private loadAbortController: AbortController | null = null;
  private refreshAbortController: AbortController | null = null;

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

    this.refreshAbortController?.abort();
    this.refreshAbortController = null;
    this.loadAbortController?.abort();
    const abortController = new AbortController();
    this.loadAbortController = abortController;
    const generation = ++this.loadGeneration;

    this.isMinionLoading = true;
    this.error = null;

    apiCoreStore.minionsApi
      ?.minionGet(
        {
          collection_slug: this.slug,
          mid: this.mid,
        },
        { signal: abortController.signal }
      )
      .then((minion) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        runInAction(() => {
          this.minion = minion;
        });
      })
      .catch((error) => {
        if (generation !== this.loadGeneration) {
          return;
        }
        if (isAbortError(error)) {
          return;
        }
        console.error("Error loading minion:", error);
        runInAction(() => {
          this.error = "Failed to load minion";
        });
      })
      .finally(() => {
        if (generation !== this.loadGeneration) {
          return;
        }
        runInAction(() => {
          this.isMinionLoading = false;
        });
      });
  };

  refreshMinion = () => {
    if (this.mid.length === 0) {
      return;
    }

    this.refreshAbortController?.abort();
    const abortController = new AbortController();
    this.refreshAbortController = abortController;

    apiCoreStore.minionsApi
      ?.minionGet(
        {
          collection_slug: this.slug,
          mid: this.mid,
        },
        { signal: abortController.signal }
      )
      .then((minion) => {
        if (abortController.signal.aborted || !minion) {
          return;
        }
        runInAction(() => {
          this.minion = minion;
          this.error = null;
        });
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        console.error("Error refreshing minion:", error);
      });
  };
}
