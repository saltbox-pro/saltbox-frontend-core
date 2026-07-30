import type { CollectionModel, CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction, toJS } from "mobx";

import {
  detachNodeById,
  findNodeAndParent,
  findNodeById,
  findNodeBySlug,
} from "saltbox-core/shared/utils/tree-utils";
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
        parent.children = [newNode, ...(parent.children ?? [])];
        this.treeNodes = [...this.treeNodes];
        return;
      }
      if (slugToFind === "root") {
        this.treeNodes = [newNode, ...this.treeNodes];
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

  moveNode = (targetId: string, parentId: string, insertBeforeId?: string | null) => {
    if (this.treeNodes.length === 0) return;

    runInAction(() => {
      const target = findNodeById(this.treeNodes, targetId);
      if (!target) return;

      if (findNodeById([target], parentId)) return;

      const newParent = findNodeById(this.treeNodes, parentId);
      if (!newParent) return;

      const detached = detachNodeById(this.treeNodes, targetId);
      if (!detached) return;

      this.treeNodes = detached.nodes;

      const node = detached.node;
      node.parent_id = newParent.id;

      const children = [...(newParent.children ?? [])];
      const insertIndex = insertBeforeId
        ? children.findIndex((child) => child.id === insertBeforeId)
        : -1;

      if (insertIndex >= 0) {
        children.splice(insertIndex, 0, node);
      } else {
        children.push(node);
      }
      newParent.children = children;

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

  moveCollection = async (
    targetId: string,
    parentId: string,
    insertBeforeId: string | null = null
  ) => {
    const snapshot = toJS(this.treeNodes);

    this.actionStatus = "in-process";
    this.moveNode(targetId, parentId, insertBeforeId);

    try {
      await apiCoreStore.minionCollectionsApi?.minionCollectionMove({
        CollectionMoveRequestSchema: {
          target_id: targetId,
          parent_id: parentId,
          insert_before_id: insertBeforeId,
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
        this.treeNodes = snapshot;
        this.actionStatus = "error";
        this.actionError =
          err instanceof Error ? err.message : "collection.error-moving-collection";
        this.actionErrorRaw = err;
      });
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
