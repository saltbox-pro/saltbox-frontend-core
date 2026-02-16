import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function getParentKey(key: Key, tree: CollectionTreeAntdNode[]): Key | null {
  for (const node of tree) {
    if (node.children) {
      if (node.children.some((child) => child.key === key)) {
        return node.key;
      }
      const parentKey = getParentKey(key, node.children);
      if (parentKey !== null) {
        return parentKey;
      }
    }
  }
  return null;
}
