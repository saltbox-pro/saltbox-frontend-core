import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function collectMatchedKeys(nodes: CollectionTreeAntdNode[], search: string): Set<Key> {
  const matched = new Set<Key>();
  if (!search.trim()) return matched;

  const lower = search.trim().toLowerCase();

  function walk(nodesList: CollectionTreeAntdNode[]) {
    for (const node of nodesList) {
      if (
        String(node.title ?? "")
          .toLowerCase()
          .includes(lower)
      ) {
        matched.add(node.key);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return matched;
}
