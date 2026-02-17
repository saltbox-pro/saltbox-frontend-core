import type { CollectionTreeAntdNode } from "../types/node";

export function filterTree(
  nodes: CollectionTreeAntdNode[],
  search: string
): CollectionTreeAntdNode[] | null {
  if (!search.trim()) return null;

  const lower = search.trim().toLowerCase();

  function recurse(node: CollectionTreeAntdNode): CollectionTreeAntdNode | null {
    const selfMatch = String(node.title ?? "")
      .toLowerCase()
      .includes(lower);

    const filteredChildren = (node.children ?? [])
      .map(recurse)
      .filter((n): n is CollectionTreeAntdNode => n !== null);

    if (selfMatch) {
      return { ...node, children: node.children };
    }

    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    return null;
  }

  const filtered = nodes.map(recurse).filter((n): n is CollectionTreeAntdNode => n !== null);
  if (filtered.length === 0) return [];
  return filtered;
}
