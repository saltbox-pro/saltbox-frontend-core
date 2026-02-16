import type { TreeDataNode } from "antd";

export type CollectionTreeAntdNode = TreeDataNode & {
  slug: string;
  children?: CollectionTreeAntdNode[];
};
