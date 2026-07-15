import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function findParentByKey(
  nodes: CollectionTreeAntdNode[],
  key: Key,
  parent: CollectionTreeAntdNode | null = null
): CollectionTreeAntdNode | null {
  for (const node of nodes) {
    if (node.key === key) return parent;
    if (node.children?.length) {
      const found = findParentByKey(node.children, key, node);
      if (found !== null) return found;
    }
  }
  return null;
}
