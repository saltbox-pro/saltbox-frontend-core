import type { Description, TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Alert, Button, Collapse, CollapseProps, Flex, List, Tag } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import styles from "./repo-card-templates.module.css";

function resolveDescription(
  description: Description | null | undefined,
  language: string
): string | undefined {
  if (description == null) return undefined;
  if (typeof description === "string") return description;
  if (typeof description === "object") {
    const localized = (description as Record<string, string>)[language];
    if (localized) return localized;
    const fallback = Object.values(description as Record<string, string>)[0];
    return fallback;
  }
  return undefined;
}

export interface RepoCardTemplatesProps {
  items: TaskTemplatePublicSchema[];
  isLoading: boolean;
  isLoadedOnce: boolean;
  hasMore: boolean;
  hasError?: boolean;
  onOpen: () => void;
  onLoadMore: () => void;
}

export function RepoCardTemplates({
  items,
  isLoading,
  isLoadedOnce,
  hasMore,
  hasError = false,
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
            {hasError ? (
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
                renderItem={({ title, description, name }) => (
                  <List.Item className={styles.templateItem} extra={<Tag>{name}</Tag>}>
                    <List.Item.Meta
                      title={title}
                      description={resolveDescription(description, i18n.language)}
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
    [hasError, hasMore, i18n.language, isLoadedOnce, isLoading, onLoadMore, t, items]
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
