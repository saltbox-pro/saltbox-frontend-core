import type {
  CollectionCreateRequestSchema,
  CollectionModel,
  CollectionTreeNodeSchema,
} from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction, toJS } from "mobx";

import {
  detachNodeById,
  findNodeAndParent,
  findNodeById,
  findNodeBySlug,
} from "saltbox-core/shared/utils/tree-utils";
import { apiCoreStore } from "saltbox-core/store";

export class CollectionsTreeStore {
  treeNodes: CollectionTreeNodeSchema[] = [];
  isMoving = false;

  readonly treeLoad = createLoader({
    run: () => apiCoreStore.minionCollectionsApi?.minionCollectionsTree(),
    onSuccess: (nodes) => {
      this.treeNodes = nodes ?? [];
    },
  });

  constructor() {
    makeAutoObservable(this, { treeLoad: false });
  }

  get isTreeLoaded(): boolean {
    return this.treeLoad.status === "success";
  }

  loadTree = (force = false) => {
    if ((!force && this.isTreeLoaded) || this.treeLoad.isLoading) return;

    this.treeLoad.run().catch(() => undefined);
  };

  addNode = (collection: CollectionModel) => {
    if (!this.isTreeLoaded) return;

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

  updateCollection = async (
    slug: string,
    payload: { title: string; description?: string }
  ): Promise<void> => {
    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return Promise.reject(new Error("Minion collections API is not available"));

    const current = await api.minionCollectionRead({ slug });
    const updated = await api.minionCollectionUpdate({
      slug,
      CollectionUpdateSchema: {
        title: payload.title,
        query: current?.query,
        description: payload.description ?? "",
      },
    });

    this.updateNode(slug, {
      title: updated.title,
      slug: updated.slug,
      description: updated.description,
    });
  };

  moveCollection = async (
    targetId: string,
    parentId: string,
    insertBeforeId: string | null = null
  ): Promise<void> => {
    if (this.isMoving) return;

    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return Promise.reject(new Error("Minion collections API is not available"));

    const snapshot = toJS(this.treeNodes);

    runInAction(() => {
      this.isMoving = true;
    });
    this.moveNode(targetId, parentId, insertBeforeId);

    try {
      const nodes = await api.minionCollectionMove({
        CollectionMoveRequestSchema: {
          target_id: targetId,
          parent_id: parentId,
          insert_before_id: insertBeforeId,
        },
      });

      runInAction(() => {
        this.treeNodes = nodes;
      });
    } catch (error) {
      runInAction(() => {
        this.treeNodes = snapshot;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isMoving = false;
      });
    }
  };

  createCollection = async (payload: CollectionCreateRequestSchema): Promise<CollectionModel> => {
    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return Promise.reject(new Error("Minion collections API is not available"));

    const created = await api.minionCollectionCreate({ CollectionCreateRequestSchema: payload });

    this.addNode(created);

    return created;
  };

  deleteCollection = async (slug: string): Promise<void> => {
    const api = apiCoreStore.minionCollectionsApi;
    if (!api) return Promise.reject(new Error("Minion collections API is not available"));

    await api.minionCollectionDelete({ slug });

    this.removeNode(slug);
  };
}

export const collectionsTreeStore = new CollectionsTreeStore();
