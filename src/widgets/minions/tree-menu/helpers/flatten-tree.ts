import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export interface FlatTreeItem {
  key: Key;
  title: string;
}

export function flattenTree(nodes: CollectionTreeAntdNode[]): FlatTreeItem[] {
  const list: FlatTreeItem[] = [];

  function traverse(items: CollectionTreeAntdNode[]) {
    for (const item of items) {
      list.push({ key: item.key, title: String(item.title ?? "") });
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(nodes);
  return list;
}
