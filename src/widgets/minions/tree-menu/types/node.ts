import type { TreeDataNode } from "antd";

export type CollectionTreeAntdNode = TreeDataNode & {
  slug: string;
  description?: string;
  minionsCount: number;
  children?: CollectionTreeAntdNode[];
};
