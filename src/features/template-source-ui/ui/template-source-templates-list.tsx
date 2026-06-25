import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateDescriptionText } from "saltbox-core/shared/utils/template-description";

import { TemplateSourceSectionEmpty } from "./template-source-section-empty";
import styles from "./template-source-templates-list.module.css";

export type TemplateSourceTemplatesListProps = {
  items: TaskTemplatePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
  onTemplateClick?: (template: TaskTemplatePublicSchema) => void;
  activeTemplateId?: string | null;
  renderItemActions?: (template: TaskTemplatePublicSchema) => ReactNode;
};

export function TemplateSourceTemplatesList({
  items,
  constrainHeight = true,
  searchQuery,
  onTemplateClick,
  activeTemplateId,
  renderItemActions,
}: TemplateSourceTemplatesListProps) {
  const { t, i18n } = useTranslation();

  return (
    <List
      className={
        constrainHeight ? `${styles.templates} ${styles.templatesConstrained}` : styles.templates
      }
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

        return (
          <List.Item
            className={`${styles.templateItem}${activeTemplateId === template.id ? ` ${styles.templateItemActive}` : ""}${onTemplateClick ? ` ${styles.templateItemClickable}` : ""}`}
            onClick={onTemplateClick ? () => onTemplateClick(template) : undefined}
            extra={
              <Flex align="center" gap={8} wrap="wrap" justify="flex-end">
                <Flex wrap="wrap" justify="flex-end">
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
              title={<SearchHighlightText text={title} query={searchQuery} />}
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
