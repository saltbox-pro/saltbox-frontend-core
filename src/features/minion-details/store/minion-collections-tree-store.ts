import type { CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction } from "mobx";

import { fetchMinionCollectionsTree } from "../api/fetch-minion-collections-tree";

export class MinionCollectionsTreeStore {
  treeNodes: CollectionTreeNodeSchema[] = [];
  private loadedMinionInnerId: string | undefined;
  private loadingMinionInnerId: string | undefined;
  private loadGeneration = 0;

  readonly treeLoad = createLoader({
    run: fetchMinionCollectionsTree,
    onSuccess: (nodes, id) => {
      if (this.loadingMinionInnerId !== id) {
        return;
      }

      this.treeNodes = nodes ?? [];
      this.loadedMinionInnerId = id;
      this.loadingMinionInnerId = undefined;
    },
  });

  constructor() {
    makeAutoObservable(this, { treeLoad: false });
  }

  isReadyFor(minionInnerId: string | undefined): boolean {
    return minionInnerId !== undefined && this.loadedMinionInnerId === minionInnerId;
  }

  ensureLoaded(minionInnerId: string, options?: { force?: boolean }): void {
    if (!options?.force && this.isReadyFor(minionInnerId)) {
      return;
    }

    if (!options?.force && this.treeLoad.isLoading && this.loadingMinionInnerId === minionInnerId) {
      return;
    }

    const keepStaleData = Boolean(options?.force) && this.loadedMinionInnerId === minionInnerId;

    if (!keepStaleData) {
      this.treeNodes = [];
      this.loadedMinionInnerId = undefined;
      this.treeLoad.resetInitial();
    }

    const generation = ++this.loadGeneration;
    this.loadingMinionInnerId = minionInnerId;

    this.treeLoad.run(minionInnerId).finally(() => {
      runInAction(() => {
        if (this.loadGeneration === generation && this.loadingMinionInnerId === minionInnerId) {
          this.loadingMinionInnerId = undefined;
        }
      });
    });
  }

  reloadIfLoaded(minionInnerId: string): void {
    if (this.loadedMinionInnerId !== minionInnerId) {
      return;
    }

    this.ensureLoaded(minionInnerId, { force: true });
  }

  reset(): void {
    this.loadGeneration += 1;
    this.treeNodes = [];
    this.loadedMinionInnerId = undefined;
    this.loadingMinionInnerId = undefined;
    this.treeLoad.resetInitial();
  }
}
