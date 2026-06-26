import {
  SourceState,
  type SourceOperation,
  type SourceType,
} from "@saltbox/saltbox-core-api-client";
import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Avatar, Card, Divider, Flex, Typography } from "antd";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router";

import {
  TemplateSourceDimmed,
  TemplateSourceTypeTag,
} from "saltbox-core/features/template-source-ui";

import { TemplateSourceActiveStatusTag } from "../../../shared/ui/template-source-active-status-tag";
import { TemplateSourceBrokenOperationTag } from "../../../shared/ui/template-source-broken-operation-tag";
import { TemplateSourceConnectionTag } from "../../../shared/ui/template-source-connection-tag";
import {
  TemplateSourceExtrasCollapse,
  type TemplateSourceExtrasCollapseProps,
} from "../../../shared/ui/template-source-extras-collapse";
import { TemplateSourceInfo } from "../../../shared/ui/template-source-info";

import styles from "./template-source-list-item.module.css";

const { Text } = Typography;

export interface TemplateSourceListItemProps {
  name: string;
  sourceType: SourceType;
  sourceState: SourceState;
  currentOperation: SourceOperation | null;
  showActiveStatusTag?: boolean;
  webUrl?: string;
  isConnected: boolean;
  description?: string;
  createdAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
  extras?: TemplateSourceExtrasCollapseProps;
  betweenInfoAndTemplates?: ReactNode;
  headerExtra?: ReactNode;
  forceDimmed?: boolean;
  detailHref?: string;
  searchQuery?: string;
}

export function TemplateSourceListItem({
  description,
  name,
  sourceType,
  sourceState,
  currentOperation,
  showActiveStatusTag = false,
  isConnected,
  createdAt,
  syncedAt,
  showNotSynced,
  webUrl,
  extras,
  betweenInfoAndTemplates,
  headerExtra,
  forceDimmed = false,
  detailHref,
  searchQuery,
}: TemplateSourceListItemProps) {
  const dimmed = !isConnected || forceDimmed;
  const isBroken = sourceState === SourceState.Broken;

  const titleContent = (
    <Flex align="center" justify="space-between" gap="small" className={styles.headerRow}>
      <span className={styles.headerLeading}>
        <Avatar className={styles.avatar} size="small" shape="square">
          {name[0]}
        </Avatar>

        <Text className={styles.name} title={name}>
          <SearchHighlightText text={name} query={searchQuery} />
        </Text>

        <Flex align="center" gap="small" className={styles.titleMeta}>
          <TemplateSourceTypeTag sourceType={sourceType} />

          <Divider type="vertical" />

          <Flex align="center" gap={5}>
            <TemplateSourceConnectionTag isConnected={isConnected} />
            {showActiveStatusTag && <TemplateSourceActiveStatusTag />}
            {isBroken && <TemplateSourceBrokenOperationTag currentOperation={currentOperation} />}
          </Flex>
        </Flex>
      </span>
    </Flex>
  );

  return (
    <Card
      className={clsx(styles.card, dimmed && styles.cardDisconnected)}
      classNames={{
        header: clsx(detailHref && styles.cardHeadClickable),
        title: styles.title,
        extra: styles.extra,
      }}
      size="small"
      title={
        detailHref ? (
          <Link to={detailHref} className={styles.headerLink} title={name}>
            {titleContent}
          </Link>
        ) : (
          titleContent
        )
      }
      extra={headerExtra ?? <TemplateSourceConnectionTag isConnected={isConnected} />}
    >
      <Flex vertical gap="small">
        <TemplateSourceInfo
          description={description}
          webUrl={webUrl}
          createdAt={createdAt}
          syncedAt={syncedAt}
          showNotSynced={showNotSynced}
          dimmed={dimmed}
          searchQuery={searchQuery}
        />

        {!!betweenInfoAndTemplates && betweenInfoAndTemplates}

        {!!extras && (
          <TemplateSourceDimmed dimmed={dimmed}>
            <TemplateSourceExtrasCollapse {...extras} />
          </TemplateSourceDimmed>
        )}
      </Flex>
    </Card>
  );
}
