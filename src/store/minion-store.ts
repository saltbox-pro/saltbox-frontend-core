import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { isAbortError } from "saltbox-core/shared/helpers/is-abort-error";
import { apiCoreStore } from "saltbox-core/store";

export class MinionStore {
  mid: string;
  slug: string;
  minion: MinionDetailSchema | null;
  isMinionRefreshing: boolean;
  private refreshAbortController: AbortController | null = null;

  readonly minionLoad = createLoader({
    run: () =>
      this.mid.length === 0
        ? undefined
        : apiCoreStore.minionsApi?.minionGet({
            collection_slug: this.slug,
            mid: this.mid,
          }),
    onSuccess: (minion) => {
      this.minion = minion;
    },
  });

  constructor(slug: string, minionId: string, options?: { initialMinion?: MinionDetailSchema }) {
    makeAutoObservable(this, { minionLoad: false });

    this.slug = slug;
    this.mid = minionId;
    this.isMinionRefreshing = false;
    this.minion = null;

    if (options?.initialMinion) {
      this.minion = options.initialMinion;
      return;
    }

    this.loadMinion();
  }

  get isMinionLoading(): boolean {
    return this.minionLoad.isLoading;
  }

  loadMinion = () => {
    if (this.mid.length === 0) {
      return;
    }

    this.refreshAbortController?.abort();
    this.refreshAbortController = null;
    this.isMinionRefreshing = false;

    this.minionLoad.run().catch(() => undefined);
  };

  refreshMinion = () => {
    if (this.mid.length === 0) {
      return;
    }

    const minionsApi = apiCoreStore.minionsApi;
    if (!minionsApi) {
      return;
    }

    this.refreshAbortController?.abort();
    const abortController = new AbortController();
    this.refreshAbortController = abortController;
    this.isMinionRefreshing = true;

    minionsApi
      .minionGet(
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
        });
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        console.error("Error refreshing minion:", error);
      })
      .finally(() => {
        if (this.refreshAbortController !== abortController) {
          return;
        }
        runInAction(() => {
          this.isMinionRefreshing = false;
        });
      });
  };
}
