import type { SourceType } from "@saltbox/saltbox-core-api-client";
import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Avatar, Card, Divider, Flex, Typography } from "antd";
import type { MouseEvent, ReactNode } from "react";
import { useNavigate } from "react-router";

import { TemplateSourceActiveStatusTag } from "../../../shared/ui/template-source-active-status-tag";
import { TemplateSourceConnectionTag } from "../../../shared/ui/template-source-connection-tag";
import {
  TemplateSourceExtrasCollapse,
  type TemplateSourceExtrasCollapseProps,
} from "../../../shared/ui/template-source-extras-collapse";
import { TemplateSourceInfo } from "../../../shared/ui/template-source-info";
import infoStyles from "../../../shared/ui/template-source-info.module.css";
import { TemplateSourceTypeTag } from "../../../shared/ui/template-source-type-tag";

import styles from "./template-source-list-item.module.css";

const { Text } = Typography;

const CARD_NAV_IGNORE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, .ant-modal-wrap, .ant-modal, .ant-upload, .ant-segmented, .ant-collapse, .ant-collapse-header";

function isOverlayOpen(): boolean {
  return typeof document !== "undefined" && Boolean(document.querySelector(".ant-modal-open"));
}

function shouldIgnoreCardNavigation(event: MouseEvent<HTMLElement>): boolean {
  return (
    isOverlayOpen() || Boolean((event.target as HTMLElement).closest(CARD_NAV_IGNORE_SELECTOR))
  );
}

export interface TemplateSourceListItemProps {
  name: string;
  sourceType: SourceType;
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
  const navigate = useNavigate();
  const cardClassName = [
    styles.card,
    !isConnected || forceDimmed ? styles.cardDisconnected : undefined,
    detailHref ? styles.cardClickable : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const dimmed = !isConnected || forceDimmed;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (!detailHref || shouldIgnoreCardNavigation(event)) {
      return;
    }
    navigate(detailHref);
  };

  return (
    <Card
      className={cardClassName}
      onClick={detailHref ? handleCardClick : undefined}
      classNames={{
        title: styles.title,
        extra: styles.extra,
      }}
      size="small"
      hoverable
      title={
        <Flex align="center" justify="space-between" gap="small" className={styles.headerRow}>
          <span className={styles.headerLeading}>
            <Avatar className={styles.avatar} size="small" shape="square">
              {name[0]}
            </Avatar>

            <Text className={styles.name}>
              <SearchHighlightText text={name} query={searchQuery} />
            </Text>

            <Flex align="center" gap="small" className={styles.titleMeta}>
              <TemplateSourceTypeTag sourceType={sourceType} />

              <Divider type="vertical" />

              <Flex align="center" gap={5}>
                <TemplateSourceConnectionTag isConnected={isConnected} />

                {showActiveStatusTag && <TemplateSourceActiveStatusTag />}
              </Flex>
            </Flex>
          </span>
        </Flex>
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
          <div className={dimmed ? infoStyles.dimmed : undefined}>
            <TemplateSourceExtrasCollapse {...extras} />
          </div>
        )}
      </Flex>
    </Card>
  );
}
