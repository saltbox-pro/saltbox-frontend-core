import type { SourceType } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";

import { TemplateSourceActiveStatusTag } from "./template-source-active-status-tag";
import { TemplateSourceConnectionTag } from "./template-source-connection-tag";
import { TemplateSourceTypeTag } from "./template-source-type-tag";

export type TemplateSourceTagsProps = {
  sourceType: SourceType;
  isConnected: boolean;
  showActiveStatus?: boolean;
};

export function TemplateSourceTags({
  sourceType,
  isConnected,
  showActiveStatus = false,
}: TemplateSourceTagsProps) {
  return (
    <Flex align="center" gap="small" wrap>
      <TemplateSourceTypeTag sourceType={sourceType} />
      <TemplateSourceConnectionTag isConnected={isConnected} />
      {showActiveStatus && <TemplateSourceActiveStatusTag />}
    </Flex>
  );
}
