import type { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { Alert, Button, Collapse, CollapseProps, Flex, List, Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import styles from "./repo-card-templates.module.css";

export interface RepoCardTemplatesProps {
  items: TaskTemplateShortSchema[];
  isLoading: boolean;
  isLoadedOnce: boolean;
  hasMore: boolean;
  error?: string | null;
  onOpen: () => void;
  onLoadMore: () => void;
}

export function RepoCardTemplates({
  items,
  isLoading,
  isLoadedOnce,
  hasMore,
  error,
  onOpen,
  onLoadMore,
}: RepoCardTemplatesProps) {
  const { t, i18n } = useTranslation();

  const collapses = useMemo<CollapseProps["items"]>(
    () => [
      {
        key: "templates",
        label: t("configuration-templates.repo.templates"),
        children: (
          <Flex vertical gap="small">
            {error ? (
              <Alert
                message={t("configuration-templates.repo.templates-load-error")}
                type="error"
                showIcon
              />
            ) : (
              <List
                className={styles.templates}
                size="small"
                loading={isLoading && items.length === 0}
                dataSource={items}
                locale={{ emptyText: t("configuration-templates.repo.templates-empty") }}
                renderItem={({ title, description, fun }) => (
                  <List.Item className={styles.templateItem} extra={<Tag>{fun}</Tag>}>
                    <List.Item.Meta
                      title={title}
                      description={!!description && description[i18n.language]}
                    />
                  </List.Item>
                )}
                loadMore={
                  isLoadedOnce &&
                  hasMore && (
                    <Flex justify="center">
                      <Button
                        className={styles.loadMoreButton}
                        onClick={onLoadMore}
                        loading={isLoading && items.length !== 0}
                        size="small"
                      >
                        {t("configuration-templates.repo.templates-load-more")}
                      </Button>
                    </Flex>
                  )
                }
                split={false}
              />
            )}
          </Flex>
        ),
      },
    ],
    [error, hasMore, i18n.language, isLoadedOnce, isLoading, onLoadMore, t, items]
  );

  return (
    <Collapse
      className={styles.container}
      items={collapses}
      size="small"
      ghost
      destroyOnHidden
      onChange={(keys) => {
        const opened = Array.isArray(keys) ? keys.includes("templates") : keys === "templates";
        if (opened) onOpen();
      }}
    />
  );
}
