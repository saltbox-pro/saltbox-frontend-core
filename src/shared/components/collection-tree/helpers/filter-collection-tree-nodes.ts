import type { CollectionTreeAntdNode } from "../types";

export function filterCollectionTreeNodes(
  nodes: CollectionTreeAntdNode[],
  search: string
): CollectionTreeAntdNode[] | null {
  if (!search.trim()) {
    return null;
  }

  const lower = search.trim().toLowerCase();

  function recurse(node: CollectionTreeAntdNode): CollectionTreeAntdNode | null {
    const selfMatch = node.titleText.toLowerCase().includes(lower);

    const filteredChildren = (node.children ?? [])
      .map(recurse)
      .filter((child): child is CollectionTreeAntdNode => child !== null);

    if (selfMatch) {
      return { ...node, children: node.children };
    }

    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    return null;
  }

  return nodes.map(recurse).filter((node): node is CollectionTreeAntdNode => node !== null);
}
