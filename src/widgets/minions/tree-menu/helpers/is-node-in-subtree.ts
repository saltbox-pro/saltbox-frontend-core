import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function isNodeInSubtree(root: CollectionTreeAntdNode, key: Key): boolean {
  if (root.key === key) return true;
  const children = root.children as CollectionTreeAntdNode[] | undefined;
  return !!children?.some((child) => isNodeInSubtree(child, key));
}
