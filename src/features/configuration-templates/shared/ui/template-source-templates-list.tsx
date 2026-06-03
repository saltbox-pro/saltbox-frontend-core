import type { Description, TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Alert, List, Tag } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./template-source-templates-section.module.css";

function resolveDescription(
  description: Description | null | undefined,
  language: string
): string | undefined {
  if (description == null) return undefined;

  if (typeof description === "string") return description;

  if (typeof description === "object") {
    const localized = (description as Record<string, string>)[language];
    if (localized) return localized;

    return Object.values(description as Record<string, string>)[0];
  }

  return undefined;
}

export type TemplateSourceTemplatesListProps = {
  items: TaskTemplatePublicSchema[];
  isLoading: boolean;
  hasError?: boolean;
  constrainHeight?: boolean;
};

export function TemplateSourceTemplatesList({
  items,
  isLoading,
  hasError = false,
  constrainHeight = true,
}: TemplateSourceTemplatesListProps) {
  const { t, i18n } = useTranslation();

  if (hasError) {
    return (
      <Alert
        message={t("configuration-templates.source.templates-load-error")}
        type="error"
        showIcon
      />
    );
  }

  return (
    <List
      className={
        constrainHeight ? `${styles.templates} ${styles.templatesConstrained}` : styles.templates
      }
      size="small"
      loading={isLoading && items.length === 0}
      dataSource={items}
      locale={{ emptyText: t("configuration-templates.source.templates-empty") }}
      renderItem={({ title, description, name }) => (
        <List.Item className={styles.templateItem} extra={<Tag>{name}</Tag>}>
          <List.Item.Meta
            title={title}
            description={resolveDescription(description, i18n.language)}
          />
        </List.Item>
      )}
      split={false}
    />
  );
}
