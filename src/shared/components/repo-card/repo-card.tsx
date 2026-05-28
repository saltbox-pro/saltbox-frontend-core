import { Avatar, Card, Divider, Flex, Typography } from "antd";
import type { ReactNode } from "react";

import { RepoCardConnection } from "./repo-card-connection";
import { RepoCardDates } from "./repo-card-dates";
import { RepoCardDetails } from "./repo-card-details";
import { RepoCardTemplates, type RepoCardTemplatesProps } from "./repo-card-templates";
import styles from "./repo-card.module.css";

const { Text, Paragraph } = Typography;

export interface RepoCardProps {
  name: string;
  titleSuffix?: ReactNode;
  webUrl?: string;
  isConnected: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
  showNotSynced?: boolean;
  templates?: RepoCardTemplatesProps;
  betweenInfoAndTemplates?: ReactNode;
  headerExtra?: ReactNode;
  forceDimmed?: boolean;
}

export function RepoCard({
  description,
  name,
  titleSuffix,
  isConnected,
  updatedAt,
  createdAt,
  syncedAt,
  showNotSynced,
  webUrl,
  templates,
  betweenInfoAndTemplates,
  headerExtra,
  forceDimmed = false,
}: RepoCardProps) {
  const cardClassName =
    isConnected && !forceDimmed ? styles.card : `${styles.card} ${styles.cardDisconnected}`;
  const dimmedClassName = isConnected && !forceDimmed ? undefined : styles.dimmed;
  const hasSplitHeader = !!titleSuffix || !!headerExtra;

  const titleLeading = (
    <>
      <Avatar className={styles.avatar} size="small" shape="square">
        {name[0]}
      </Avatar>
      <Text className={styles.name}>{name}</Text>
      {!!titleSuffix && <span className={styles.titleSuffix}>{titleSuffix}</span>}
    </>
  );

  return (
    <Card
      className={cardClassName}
      classNames={{
        title: styles.title,
        extra: styles.extra,
      }}
      size="small"
      hoverable
      title={
        hasSplitHeader ? (
          <Flex align="center" justify="space-between" gap="small" className={styles.headerRow}>
            <span
              className={
                dimmedClassName
                  ? `${styles.headerLeading} ${dimmedClassName}`
                  : styles.headerLeading
              }
            >
              {titleLeading}
            </span>
            <span className={styles.headerTrailing}>
              {headerExtra ?? <RepoCardConnection isConnected={isConnected} />}
            </span>
          </Flex>
        ) : (
          <span className={dimmedClassName}>{titleLeading}</span>
        )
      }
      extra={hasSplitHeader ? undefined : <RepoCardConnection isConnected={isConnected} />}
    >
      {!!description && (
        <Paragraph type="secondary" className={dimmedClassName}>
          {description}
        </Paragraph>
      )}

      <Flex vertical gap="small">
        {!!webUrl && (
          <div className={dimmedClassName}>
            <RepoCardDetails href={webUrl} />
          </div>
        )}

        <Flex vertical gap="middle" className={dimmedClassName}>
          <RepoCardDates
            createdAt={createdAt}
            updatedAt={updatedAt}
            syncedAt={syncedAt}
            showNotSynced={showNotSynced}
          />
        </Flex>

        {!!betweenInfoAndTemplates && <div>{betweenInfoAndTemplates}</div>}

        {!!templates && (
          <>
            <Divider className={styles.divider} />

            <div className={dimmedClassName}>
              <RepoCardTemplates {...templates} />
            </div>
          </>
        )}
      </Flex>
    </Card>
  );
}
