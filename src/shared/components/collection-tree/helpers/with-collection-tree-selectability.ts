import clsx from "clsx";

import type { CollectionTreeAntdNode } from "../types";

interface WithCollectionTreeSelectabilityOptions {
  clickableClassName?: string;
}

export function withCollectionTreeSelectability(
  nodes: CollectionTreeAntdNode[],
  isSelectable: (node: CollectionTreeAntdNode) => boolean,
  options: WithCollectionTreeSelectabilityOptions = {}
): CollectionTreeAntdNode[] {
  return nodes.map((node) => {
    const selectable = isSelectable(node);

    return {
      ...node,
      selectable,
      className: clsx(node.className, selectable && options.clickableClassName),
      children: node.children?.length
        ? withCollectionTreeSelectability(node.children, isSelectable, options)
        : undefined,
    };
  });
}
