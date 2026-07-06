import type { CollectionTreeNodeSchema } from "@saltbox/saltbox-core-api-client";

import type { CollectionTreeAntdNode } from "../types/node";

export function mapToAntdNode(node: CollectionTreeNodeSchema): CollectionTreeAntdNode {
  return {
    key: node.id,
    title: node.title,
    slug: node.slug,
    description: node.description,
    children: node.children?.length ? node.children.map(mapToAntdNode) : undefined,
  };
}
