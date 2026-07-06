import type { TreeDataNode } from "antd";

export type CollectionTreeAntdNode = TreeDataNode & {
  slug: string;
  description?: string;
  children?: CollectionTreeAntdNode[];
};
