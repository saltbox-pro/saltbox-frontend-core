import { DownOutlined } from "@ant-design/icons";
import { Skeleton, Tree, type TreeProps } from "antd";
import clsx from "clsx";

import type { CollectionTreeAntdNode } from "../types";

import styles from "./collection-tree-view.module.css";

type CollectionTreeViewProps = Omit<
  TreeProps<CollectionTreeAntdNode>,
  "showLine" | "switcherIcon" | "blockNode"
> & {
  nowrapTitles?: boolean;
  compact?: boolean;
  loading?: boolean;
  compactSkeleton?: boolean;
  treeClickableStyle?: boolean;
};

export function CollectionTreeView({
  className,
  nowrapTitles = false,
  compact = false,
  loading = false,
  compactSkeleton = false,
  treeClickableStyle = true,
  treeData,
  selectable = true,
  ...treeProps
}: CollectionTreeViewProps) {
  return (
    <Skeleton
      loading={loading}
      active
      title={false}
      paragraph={
        compactSkeleton
          ? { rows: 1, width: "40%" }
          : { rows: 4, width: ["40%", "80%", "60%", "100%"] }
      }
    >
      <Tree<CollectionTreeAntdNode>
        {...treeProps}
        selectable={selectable}
        treeData={treeData}
        className={clsx(
          styles.tree,
          selectable && treeClickableStyle && styles.treeSelectable,
          nowrapTitles && styles.nowrapTitles,
          compact && styles.compact,
          className
        )}
        showLine
        blockNode
        switcherIcon={<DownOutlined />}
      />
    </Skeleton>
  );
}
