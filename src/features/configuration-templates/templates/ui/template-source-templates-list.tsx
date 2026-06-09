import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag } from "antd";
import { useTranslation } from "react-i18next";

import { resolveTemplateDescription } from "../../shared/helpers/resolve-template-description";
import { TemplateSourceSectionEmpty } from "../../shared/ui/template-source-section-empty";

import styles from "./template-source-templates-list.module.css";

export type TemplateSourceTemplatesListProps = {
  items: TaskTemplatePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
};

export function TemplateSourceTemplatesList({
  items,
  constrainHeight = true,
  searchQuery,
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
      renderItem={({ title, description, fun, name }) => {
        const resolvedDescription = resolveTemplateDescription(description, i18n.language);

        return (
          <List.Item
            className={styles.templateItem}
            extra={
              <Flex wrap="wrap" justify="flex-end">
                <Tag>
                  <SearchHighlightText text={name} query={searchQuery} />
                </Tag>

                <Tag>
                  <SearchHighlightText text={fun} query={searchQuery} />
                </Tag>
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
