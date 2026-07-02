import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Avatar, Flex, Typography } from "antd";

import {
  TemplateSourceDescription,
  TemplateSourceTypeTag,
} from "saltbox-core/features/template-source-ui";

import type { TemplateSourceRow } from "../../../helpers/template-picker-rows";

import styles from "./template-list-modal.module.css";

export type SourceCollapseLabelProps = {
  sourceRow: TemplateSourceRow;
  searchQuery?: string;
  getSourceLabel: (sourceName: string) => string;
};

export function SourceCollapseLabel({
  sourceRow,
  searchQuery,
  getSourceLabel,
}: SourceCollapseLabelProps) {
  const sourceLabel = getSourceLabel(sourceRow.source);

  return (
    <Flex vertical gap={4} className={styles.sourceLabel}>
      <Flex align="center" gap="small" className={styles.sourceHeader}>
        <Avatar className={styles.sourceAvatar} size="small" shape="square">
          {sourceLabel[0]}
        </Avatar>

        <Typography.Text strong className={styles.sourceName} title={sourceLabel}>
          <SearchHighlightText text={sourceLabel} query={searchQuery} />
        </Typography.Text>

        <TemplateSourceTypeTag sourceType={sourceRow.sourceType} />
      </Flex>

      {!!sourceRow.description && (
        <TemplateSourceDescription description={sourceRow.description} searchQuery={searchQuery} />
      )}
    </Flex>
  );
}
