import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag } from "antd";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateDescriptionText } from "saltbox-core/shared/utils/template-description";

import { TemplateSourceSectionEmpty } from "./template-source-section-empty";
import styles from "./template-source-templates-list.module.css";

export type TemplateAccessibility = {
  isAccessible: boolean;
  tagLabel: string;
  disabledTitle?: string;
};

export type TemplateSourceTemplatesListProps<
  T extends TaskTemplatePublicSchema = TaskTemplatePublicSchema,
> = {
  items: T[];
  constrainHeight?: boolean;
  searchQuery?: string;
  onTemplateClick?: (template: T) => void;
  activeTemplateId?: string | null;
  renderItemActions?: (template: T) => ReactNode;
  getTemplateAccessibility?: (template: T) => TemplateAccessibility | undefined;
};

export function TemplateSourceTemplatesList<
  T extends TaskTemplatePublicSchema = TaskTemplatePublicSchema,
>({
  items,
  constrainHeight = true,
  searchQuery,
  onTemplateClick,
  activeTemplateId,
  renderItemActions,
  getTemplateAccessibility,
}: TemplateSourceTemplatesListProps<T>) {
  const { t, i18n } = useTranslation();

  return (
    <List
      className={clsx(styles.templates, constrainHeight && styles.templatesConstrained)}
      size="small"
      dataSource={items}
      locale={{
        emptyText: (
          <TemplateSourceSectionEmpty
            description={t("configuration-templates.source.templates-empty")}
          />
        ),
      }}
      renderItem={(template) => {
        const { title, description, fun, name } = template;
        const resolvedDescription = getTemplateDescriptionText(description, i18n.language);
        const accessibility = getTemplateAccessibility?.(template);
        const isAccessible = accessibility?.isAccessible ?? true;
        const isClickable = Boolean(onTemplateClick && isAccessible);

        return (
          <List.Item
            className={clsx(
              styles.templateItem,
              activeTemplateId === template.id && styles.templateItemActive,
              isClickable && styles.templateItemClickable,
              accessibility && !isAccessible && styles.templateItemDisabled
            )}
            title={accessibility && !isAccessible ? accessibility.disabledTitle : undefined}
            onClick={isClickable ? () => onTemplateClick?.(template) : undefined}
            extra={
              <Flex align="center" gap={8} wrap="wrap" justify="flex-end">
                <Flex wrap="wrap" justify="flex-end" className={styles.templateItemTags}>
                  <Tag>
                    <SearchHighlightText text={name} query={searchQuery} />
                  </Tag>

                  <Tag>
                    <SearchHighlightText text={fun} query={searchQuery} />
                  </Tag>
                </Flex>

                {renderItemActions?.(template)}
              </Flex>
            }
          >
            <List.Item.Meta
              title={
                <Flex align="center" gap={8} wrap="wrap">
                  <Flex>
                    <SearchHighlightText text={title} query={searchQuery} />
                  </Flex>

                  {accessibility && (
                    <Tag
                      color={isAccessible ? "success" : "gold"}
                      className={styles.accessibilityTag}
                    >
                      {accessibility.tagLabel}
                    </Tag>
                  )}
                </Flex>
              }
              description={
                resolvedDescription ? (
                  <SearchHighlightText text={resolvedDescription} query={searchQuery} />
                ) : undefined
              }
            />
          </List.Item>
        );
      }}
      split={false}
    />
  );
}
