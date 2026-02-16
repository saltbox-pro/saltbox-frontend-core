import type { CollectionModel, CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { findNodeAndParent, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { apiCoreStore } from "saltbox-core/store";

export class CollectionsTreeStore {
  treeNodes: CollectionTreeNodeSchema[] = [];
  isTreeLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  loadTree = (force = false) => {
    if (!force && this.treeNodes.length > 0) return;

    this.isTreeLoading = true;
    apiCoreStore.minionCollectionsApi
      ?.minionCollectionsTree()
      .then((nodes) => {
        runInAction(() => {
          this.error = null;
          this.treeNodes = nodes ?? [];
        });
      })
      .catch((err) => {
        runInAction(() => {
          this.error = err instanceof Error ? err.message : "collection.error-loading-tree";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isTreeLoading = false;
        });
      });
  };

  addNode = (collection: CollectionModel) => {
    const newNode: CollectionTreeNodeSchema = {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      parent_id: collection.parent_id ?? undefined,
      children: [],
    };

    runInAction(() => {
      const parentSlug = collection.parent_slug ?? "";
      const slugToFind = !parentSlug || parentSlug === "root" ? "root" : parentSlug;
      const parent = findNodeBySlug(this.treeNodes, slugToFind);
      if (parent) {
        parent.children = [...(parent.children ?? []), newNode];
        return;
      }
      if (slugToFind === "root") {
        this.treeNodes = [...this.treeNodes, newNode];
      }
    });
  };

  removeNode = (slug: string) => {
    runInAction(() => {
      const found = findNodeAndParent(this.treeNodes, slug);
      if (!found) return;

      if ("rootIndex" in found) {
        this.treeNodes = this.treeNodes.filter((n) => n.slug !== slug);
      } else {
        const { parent, index } = found;
        parent.children = parent.children!.filter((_, i) => i !== index);
      }
    });
  };

  updateNode = (oldSlug: string, payload: { title: string; slug: string }) => {
    runInAction(() => {
      const node = findNodeBySlug(this.treeNodes, oldSlug);
      if (!node) return;
      node.title = payload.title;
      node.slug = payload.slug;
    });
  };
}

export const collectionsTreeStore = new CollectionsTreeStore();
