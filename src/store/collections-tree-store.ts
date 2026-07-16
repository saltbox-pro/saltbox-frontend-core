import type { CollectionModel, CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { findNodeAndParent, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { apiCoreStore } from "saltbox-core/store";

type FetchTreeStatus = "idle" | "in-process" | "error" | "success";
type ActionStatus = "idle" | "in-process" | "error" | "success";

export class CollectionsTreeStore {
  treeNodes: CollectionTreeNodeSchema[] = [];
  fetchTreeStatus: FetchTreeStatus = "idle";
  error: string | null = null;
  actionStatus: ActionStatus = "idle";
  actionError: string | null = null;
  actionErrorRaw: unknown = null;

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
      description: collection.description,
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

  moveNode = (slug: string, newParentSlug: string) => {
    if (this.treeNodes.length === 0) return;

    runInAction(() => {
      const found = findNodeAndParent(this.treeNodes, slug);
      if (!found) return;

      let node: CollectionTreeNodeSchema;
      if ("rootIndex" in found) {
        node = this.treeNodes[found.rootIndex];
        this.treeNodes = this.treeNodes.filter((_, i) => i !== found.rootIndex);
      } else {
        node = found.parent.children![found.index];
        found.parent.children = found.parent.children!.filter((_, i) => i !== found.index);
      }

      const slugToFind = !newParentSlug || newParentSlug === "root" ? "root" : newParentSlug;
      const newParent = findNodeBySlug(this.treeNodes, slugToFind);
      if (newParent) {
        node.parent_id = newParent.id;
        newParent.children = [...(newParent.children ?? []), node];
      } else if (slugToFind === "root") {
        node.parent_id = undefined;
        this.treeNodes = [...this.treeNodes, node];
      }

      this.treeNodes = [...this.treeNodes];
    });
  };

  updateNode = (
    oldSlug: string,
    payload: { title: string; slug: string; description?: string }
  ) => {
    if (this.treeNodes.length === 0) return;

    runInAction(() => {
      const node = findNodeBySlug(this.treeNodes, oldSlug);
      if (!node) return;

      node.title = payload.title;
      node.slug = payload.slug;
      node.description = payload.description;
      this.treeNodes = [...this.treeNodes];
    });
  };

  updateCollection = async (slug: string, payload: { title: string; description?: string }) => {
    this.actionStatus = "in-process";

    try {
      const current = await apiCoreStore.minionCollectionsApi?.minionCollectionRead({ slug });
      const updated = await apiCoreStore.minionCollectionsApi?.minionCollectionUpdate({
        slug,
        CollectionUpdateSchema: {
          title: payload.title,
          query: current?.query,
          description: payload.description ?? "",
        },
      });

      if (!updated) {
        runInAction(() => {
          this.actionStatus = "error";
          this.actionError = "collection.error-updating-collection";
          this.actionErrorRaw = null;
        });
        return false;
      }

      this.updateNode(slug, {
        title: updated.title,
        slug: updated.slug,
        description: updated.description,
      });

      runInAction(() => {
        this.actionStatus = "success";
        this.actionError = null;
        this.actionErrorRaw = null;
      });

      return true;
    } catch (err) {
      runInAction(() => {
        this.actionStatus = "error";
        this.actionError =
          err instanceof Error ? err.message : "collection.error-updating-collection";
        this.actionErrorRaw = err;
      });
      return false;
    }
  };

  moveCollection = async (slug: string, newParentSlug: string) => {
    this.actionStatus = "in-process";

    this.moveNode(slug, newParentSlug);

    try {
      const current = await apiCoreStore.minionCollectionsApi?.minionCollectionRead({ slug });

      if (!current) {
        throw new Error("collection.error-moving-collection");
      }

      await apiCoreStore.minionCollectionsApi?.minionCollectionUpdate({
        slug,
        CollectionUpdateSchema: {
          title: current.title,
          query: current.query,
          description: current.description ?? "",
          parent_slug: newParentSlug,
        },
      });

      runInAction(() => {
        this.actionStatus = "success";
        this.actionError = null;
        this.actionErrorRaw = null;
      });

      return true;
    } catch (err) {
      runInAction(() => {
        this.actionStatus = "error";
        this.actionError =
          err instanceof Error ? err.message : "collection.error-moving-collection";
        this.actionErrorRaw = err;
      });
      this.loadTree(true);
      return false;
    }
  };

  deleteCollection = async (slug: string) => {
    this.actionStatus = "in-process";

    try {
      await apiCoreStore.minionCollectionsApi?.minionCollectionDelete({ slug });

      this.removeNode(slug);

      runInAction(() => {
        this.actionStatus = "success";
        this.actionError = null;
        this.actionErrorRaw = null;
      });

      return true;
    } catch (err) {
      runInAction(() => {
        this.actionStatus = "error";
        this.actionError =
          err instanceof Error ? err.message : "collection.error-deleting-collection";
        this.actionErrorRaw = err;
      });
      return false;
    }
  };
}

export const collectionsTreeStore = new CollectionsTreeStore();
