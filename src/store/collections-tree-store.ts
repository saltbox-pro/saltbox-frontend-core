import type { CollectionModel, CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { findNodeAndParent, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { apiCoreStore } from "saltbox-core/store";

type FetchTreeStatus = "idle" | "in-process" | "error" | "success";

export class CollectionsTreeStore {
  treeNodes: CollectionTreeNodeSchema[] = [];
  fetchTreeStatus: FetchTreeStatus = "idle";
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  loadTree = (force = false) => {
    if ((!force && this.fetchTreeStatus === "success") || this.fetchTreeStatus === "in-process")
      return;

    this.fetchTreeStatus = "in-process";

    apiCoreStore.minionCollectionsApi
      ?.minionCollectionsTree()
      .then((nodes) => {
        runInAction(() => {
          this.fetchTreeStatus = "success";
          this.error = null;
          this.treeNodes = nodes ?? [];
        });
      })
      .catch((err) => {
        runInAction(() => {
          this.fetchTreeStatus = "error";
          this.error = err instanceof Error ? err.message : "collection.error-loading-tree";
        });
      });
  };

  addNode = (collection: CollectionModel) => {
    if (this.fetchTreeStatus !== "success") return;

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
        this.treeNodes = [...this.treeNodes];
        return;
      }
      if (slugToFind === "root") {
        this.treeNodes = [...this.treeNodes, newNode];
      }
    });
  };

  removeNode = (slug: string) => {
    if (this.treeNodes.length === 0) return;

    runInAction(() => {
      const node = findNodeAndParent(this.treeNodes, slug);
      if (!node) return;

      if ("rootIndex" in node) {
        this.treeNodes = this.treeNodes.filter((n) => n.slug !== slug);
      } else {
        const { parent, index } = node;
        parent.children = parent.children!.filter((_, i) => i !== index);
        this.treeNodes = [...this.treeNodes];
      }
    });
  };

  updateNode = (oldSlug: string, payload: { title: string; slug: string }) => {
    if (this.treeNodes.length === 0) return;

    runInAction(() => {
      const node = findNodeBySlug(this.treeNodes, oldSlug);
      if (!node) return;

      node.title = payload.title;
      node.slug = payload.slug;
      this.treeNodes = [...this.treeNodes];
    });
  };

  renameCollection = async (slug: string, title: string) => {
    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return;

    const current = await api.minionCollectionRead({ slug });
    const updated = await api.minionCollectionUpdate({
      slug,
      CollectionUpdateSchema: {
        title,
        query: current.query,
      },
    });

    runInAction(() => {
      this.updateNode(slug, { title: updated.title, slug: updated.slug });
    });

    return updated;
  };

  deleteCollection = async (slug: string) => {
    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return;

    await api.minionCollectionDelete({ slug });

    runInAction(() => {
      this.removeNode(slug);
    });
  };
}

export const collectionsTreeStore = new CollectionsTreeStore();
