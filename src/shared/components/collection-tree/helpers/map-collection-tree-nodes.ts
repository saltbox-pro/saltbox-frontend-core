import type { CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";

import type { CollectionTreeAntdNode } from "../types";

export function mapCollectionTreeNodes(
  nodes: CollectionTreeNodeSchema[]
): CollectionTreeAntdNode[] {
  return nodes.map(mapCollectionTreeNode);
}

function mapCollectionTreeNode(node: CollectionTreeNodeSchema): CollectionTreeAntdNode {
  return {
    key: node.id,
    title: node.title,
    slug: node.slug,
    description: node.description,
    minionsCount: node.minions_count ?? 0,
    isAvailable: node.is_available,
    children: node.children?.length ? node.children.map(mapCollectionTreeNode) : undefined,
  };
}
