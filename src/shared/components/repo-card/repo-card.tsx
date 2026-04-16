import { Avatar, Card, Divider, Flex, Typography } from "antd";

import { RepoCardConnection } from "./repo-card-connection";
import { RepoCardDates } from "./repo-card-dates";
import { RepoCardDetails } from "./repo-card-details";
import { RepoCardFooter } from "./repo-card-footer";
import { RepoCardTemplates, type RepoCardTemplatesProps } from "./repo-card-templates";
import styles from "./repo-card.module.css";

const { Text, Paragraph } = Typography;

export interface RepoCardProps {
  name: string;
  webUrl: string;
  isConnected: boolean;
  description?: string;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
  starCount?: number;
  forkCount?: number;
  templates?: RepoCardTemplatesProps;
}

export function RepoCard({
  visibility,
  description,
  name,
  isConnected,
  updatedAt,
  createdAt,
  syncedAt,
  starCount,
  forkCount,
  webUrl,
  templates,
}: RepoCardProps) {
  const cardClassName = isConnected ? styles.card : `${styles.card} ${styles.cardDisconnected}`;
  const dimmedClassName = isConnected ? undefined : styles.dimmed;

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
        <span className={dimmedClassName}>
          <Avatar className={styles.avatar} size="small" shape="square">
            {name[0]}
          </Avatar>
          <Text className={styles.name}>{name}</Text>
        </span>
      }
      extra={<RepoCardConnection isConnected={isConnected} />}
    >
      {!!description && (
        <Paragraph type="secondary" className={dimmedClassName}>
          {description}
        </Paragraph>
      )}

      <Flex vertical gap="small">
        <div className={dimmedClassName}>
          <RepoCardDetails href={webUrl} />
        </div>

        <Flex vertical gap="middle" className={dimmedClassName}>
          <RepoCardDates createdAt={createdAt} updatedAt={updatedAt} syncedAt={syncedAt} />

          <RepoCardFooter visibility={visibility} starCount={starCount} forkCount={forkCount} />
        </Flex>

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
