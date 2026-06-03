import type { SourceType } from "@saltbox/saltbox-core-api-client";
import { Avatar, Card, Divider, Flex, Typography } from "antd";
import type { MouseEvent, ReactNode } from "react";
import { useNavigate } from "react-router";

import { TemplateSourceActiveStatusTag } from "../../../shared/ui/template-source-active-status-tag";
import { TemplateSourceConnectionTag } from "../../../shared/ui/template-source-connection-tag";
import { TemplateSourceInfo } from "../../../shared/ui/template-source-info";
import infoStyles from "../../../shared/ui/template-source-info.module.css";
import {
  TemplateSourceTemplatesSection,
  type TemplateSourceTemplatesSectionProps,
} from "../../../shared/ui/template-source-templates-section";
import { TemplateSourceTypeTag } from "../../../shared/ui/template-source-type-tag";

import styles from "./template-source-list-item.module.css";

const { Text } = Typography;

const CARD_NAV_IGNORE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, .ant-collapse, .ant-collapse-header";

function shouldIgnoreCardNavigation(event: MouseEvent<HTMLElement>): boolean {
  return Boolean((event.target as HTMLElement).closest(CARD_NAV_IGNORE_SELECTOR));
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
  templates?: TemplateSourceTemplatesSectionProps;
  betweenInfoAndTemplates?: ReactNode;
  headerExtra?: ReactNode;
  forceDimmed?: boolean;
  detailHref?: string;
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
  templates,
  betweenInfoAndTemplates,
  headerExtra,
  forceDimmed = false,
  detailHref,
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
  const hasTags = sourceType !== undefined || showActiveStatusTag;

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

            <Text className={styles.name}>{name}</Text>

            <Flex align="center" gap="small" className={styles.titleMeta}>
              <TemplateSourceTypeTag sourceType={sourceType} />

              <Divider type="vertical" />

              {hasTags && (
                <Flex align="center" gap={5}>
                  <TemplateSourceConnectionTag isConnected={isConnected} />

                  {showActiveStatusTag && <TemplateSourceActiveStatusTag />}
                </Flex>
              )}
            </Flex>
          </span>
        </Flex>
      }
      extra={headerExtra ?? <TemplateSourceConnectionTag isConnected={isConnected} />}
    >
      <TemplateSourceInfo
        description={description}
        webUrl={webUrl}
        createdAt={createdAt}
        syncedAt={syncedAt}
        showNotSynced={showNotSynced}
        dimmed={dimmed}
      />

      {!!betweenInfoAndTemplates && <div>{betweenInfoAndTemplates}</div>}

      {!!templates && (
        <>
          <Divider className={styles.divider} />

          <div className={dimmed ? infoStyles.dimmed : undefined}>
            <TemplateSourceTemplatesSection {...templates} />
          </div>
        </>
      )}
    </Card>
  );
}
