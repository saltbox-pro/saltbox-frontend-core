import {
  SourceState,
  type SourceOperation,
  type SourceType,
} from "@saltbox/saltbox-core-api-client";
import { Divider, Flex } from "antd";

import { TemplateSourceActiveStatusTag } from "./template-source-active-status-tag";
import { TemplateSourceBrokenOperationTag } from "./template-source-broken-operation-tag";
import { TemplateSourceConnectionTag } from "./template-source-connection-tag";
import { TemplateSourceTypeTag } from "./template-source-type-tag";

export type TemplateSourceTagsProps = {
  sourceType: SourceType;
  state: SourceState;
  currentOperation: SourceOperation | null;
  isConnected: boolean;
  showActiveStatus?: boolean;
};

export function TemplateSourceTags({
  sourceType,
  state,
  currentOperation,
  isConnected,
  showActiveStatus = false,
}: TemplateSourceTagsProps) {
  const isBroken = state === SourceState.Broken;

  return (
    <Flex align="center" gap="small" wrap>
      <TemplateSourceTypeTag sourceType={sourceType} />

      <Divider type="vertical" />

      <Flex align="center" gap={5}>
        <TemplateSourceConnectionTag isConnected={isConnected} />
        {showActiveStatus && <TemplateSourceActiveStatusTag />}
        {isBroken && <TemplateSourceBrokenOperationTag currentOperation={currentOperation} />}
      </Flex>
    </Flex>
  );
}
