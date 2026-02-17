import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function collectExpandedKeys(nodes: CollectionTreeAntdNode[], matchedKeys: Set<Key>): Key[] {
  const keys: Key[] = [];

  function walk(node: CollectionTreeAntdNode): boolean {
    if (!node.children?.length) {
      return matchedKeys.has(node.key);
    }

    let hasMatchedDescendant = false;
    for (const child of node.children) {
      if (walk(child)) hasMatchedDescendant = true;
    }

    if (hasMatchedDescendant) {
      keys.push(node.key);
      return true;
    }

    return matchedKeys.has(node.key);
  }

  for (const node of nodes) {
    walk(node);
  }
  return keys;
}
