export type TreeNodeWithSlug<T = unknown> = {
  slug: string;
  children?: T[];
};

export function findNodeBySlug<T extends TreeNodeWithSlug<T>>(nodes: T[], slug: string): T | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    if (node.children?.length) {
      const found = findNodeBySlug(node.children as T[], slug);
      if (found) return found;
    }
  }
  return null;
}

export function findNodeAndParent<T extends TreeNodeWithSlug<T>>(
  nodes: T[],
  slug: string
): { parent: T; index: number } | { rootIndex: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].slug === slug) return { rootIndex: i };
    const children = nodes[i].children;
    if (children?.length) {
      const index = (children as T[]).findIndex((c) => c.slug === slug);
      if (index >= 0) return { parent: nodes[i], index };
      const found = findNodeAndParent(children as T[], slug);
      if (found) return found;
    }
  }
  return null;
}
