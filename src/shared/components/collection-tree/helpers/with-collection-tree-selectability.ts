import clsx from "clsx";

import type { CollectionTreeAntdNode } from "../types";

import styles from "./with-collection-tree-selectability.module.css";

type CollectionTreeNodeSelectability = {
  selectable: boolean;
  disabled?: boolean;
};

export function withCollectionTreeSelectability(
  nodes: CollectionTreeAntdNode[],
  resolve: (node: CollectionTreeAntdNode) => CollectionTreeNodeSelectability
): CollectionTreeAntdNode[] {
  return nodes.map((node) => {
    const { selectable, disabled } = resolve(node);

    return {
      ...node,
      selectable,
      disabled: disabled ?? node.disabled,
      className: clsx(node.className, selectable && styles.openable),
      children: node.children?.length
        ? withCollectionTreeSelectability(node.children, resolve)
        : undefined,
    };
  });
}
