import type { Key } from "react";

import type { CollectionTreeAntdNode } from "../types/node";

export function findNodePath(
  nodes: CollectionTreeAntdNode[],
  slug: string
): { nodeKey: Key; ancestorKeys: Key[] } | null {
  const ancestors: Key[] = [];

  function traverse(list: CollectionTreeAntdNode[]): Key | null {
    for (const node of list) {
      if (node.slug === slug) {
        return node.key;
      }

      if (node.children?.length) {
        ancestors.push(node.key);
        const found = traverse(node.children);
        if (found !== null) return found;
        ancestors.pop();
      }
    }

    return null;
  }

  const nodeKey = traverse(nodes);

  if (nodeKey === null) return null;

  return { nodeKey, ancestorKeys: [...ancestors] };
}
