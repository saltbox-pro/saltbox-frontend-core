import { Flex } from "antd";
import clsx from "clsx";
import type { ReactNode } from "react";

import { CollectionMinionsCountTag } from "saltbox-core/shared/components/collection-minions-count-tag";

import type { CollectionTreeAntdNode } from "../types";

import styles from "./collection-tree-node-title.module.css";

interface CollectionTreeNodeTitleProps {
  node: CollectionTreeAntdNode;
  limitTitleWidth?: boolean;
  extra?: ReactNode;
}

export function CollectionTreeNodeTitle({
  node,
  limitTitleWidth = false,
  extra,
}: CollectionTreeNodeTitleProps) {
  return (
    <Flex className={styles.root} align="center" gap="small">
      <span
        className={clsx(styles.title, limitTitleWidth && styles.titleLimited)}
        title={node.titleText}
      >
        {node.title}
      </span>
      <CollectionMinionsCountTag count={node.minionsCount} className={styles.count} />
      {extra}
    </Flex>
  );
}
