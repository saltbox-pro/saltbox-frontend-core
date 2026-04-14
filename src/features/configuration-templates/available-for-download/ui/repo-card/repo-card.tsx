import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { GitlabProjectSchema } from "@saltbox/saltbox-core-api-client";
import { RelativeTime } from "@saltbox/saltbox-frontend-common";
import { Avatar, Card, Divider, Flex, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { RepoCardStats } from "./repo-card-stats";
import { RepoCardVisibility } from "./repo-card-visibility";
import styles from "./repo-card.module.css";

const { Text, Paragraph, Link } = Typography;

type RepoCardProps = GitlabProjectSchema;

export function RepoCard({
  visibility,
  description,
  name,
  updated_at: updatedAt,
  created_at: createdAt,
  star_count: starCount,
  forks_count: forkCount,
  web_url: webUrl,
}: RepoCardProps) {
  const { t } = useTranslation();

  const initial = name?.trim() ? Array.from(name.trim())[0] : "?";

  return (
    <Card
      className={styles.card}
      classNames={{
        title: styles.title,
        extra: styles.extra,
      }}
      size="small"
      hoverable
      title={
        <>
          <Avatar className={styles.avatar} size="small" shape="square">
            {initial}
          </Avatar>
          <Text className={styles.name}>{name}</Text>
        </>
      }
      extra={<RepoCardVisibility visibility={visibility} />}
    >
      {!!description && <Paragraph type="secondary">{description}</Paragraph>}

      <Flex vertical gap="small">
        <Space align="start" size={3}>
          <Text type="secondary" className={styles.secondaryText}>
            URL:{" "}
          </Text>
          <Link href={webUrl} target="_blank">
            {webUrl}
          </Link>
        </Space>

        <Space align="center" split={<Divider type="vertical" />}>
          <Space size={3}>
            <Text type="secondary" className={styles.secondaryText}>
              <CalendarOutlined /> {t("configuration-templates.repo.created-at")}:
            </Text>
            <RelativeTime date={createdAt} />
          </Space>

          <Space size={3}>
            <Text type="secondary" className={styles.secondaryText}>
              <ClockCircleOutlined /> {t("configuration-templates.repo.updated-at")}:
            </Text>
            <RelativeTime date={updatedAt} />
          </Space>
        </Space>

        <RepoCardStats starCount={starCount} forkCount={forkCount} />
      </Flex>
    </Card>
  );
}
