import { Flex, Tag } from "antd";

type CollapsePanelLabelProps = {
  title: string;
  count: number;
};

export function CollapsePanelLabel({ title, count }: CollapsePanelLabelProps) {
  return (
    <Flex align="center" gap={8}>
      <span>{title}</span>
      <Tag bordered>{count}</Tag>
    </Flex>
  );
}
