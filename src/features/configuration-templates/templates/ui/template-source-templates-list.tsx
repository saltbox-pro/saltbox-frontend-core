import { CopyOutlined, EditOutlined } from "@ant-design/icons";
import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { BaseActionButton, SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag } from "antd";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { resolveTemplateDescription } from "../../shared/helpers/resolve-template-description";
import {
  getDuplicateTemplatePath,
  getEditTemplatePath,
} from "../../shared/helpers/source-presentation";
import { TemplateSourceSectionEmpty } from "../../shared/ui/template-source-section-empty";

import styles from "./template-source-templates-list.module.css";

export type TemplateSourceTemplatesListProps = {
  items: TaskTemplatePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
  showEditTemplate?: boolean;
  canEditTemplates?: boolean;
  canDuplicateTemplates?: boolean;
};

export function TemplateSourceTemplatesList({
  items,
  constrainHeight = true,
  searchQuery,
  showEditTemplate = false,
  canEditTemplates = false,
  canDuplicateTemplates = false,
}: TemplateSourceTemplatesListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleEditClick = (event: MouseEvent<HTMLElement>, template: TaskTemplatePublicSchema) => {
    event.stopPropagation();
    navigate(getEditTemplatePath(template.source_id, template.id));
  };

  const handleDuplicateClick = (
    event: MouseEvent<HTMLElement>,
    template: TaskTemplatePublicSchema
  ) => {
    event.stopPropagation();
    navigate(getDuplicateTemplatePath(template.source_id, template.id));
  };

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
        const resolvedDescription = resolveTemplateDescription(description, i18n.language);

        return (
          <List.Item
            className={styles.templateItem}
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

                <Flex align="center" gap={4}>
                  {showEditTemplate && (
                    <BaseActionButton
                      icon={<EditOutlined />}
                      title={t("configuration-templates.source.edit-template")}
                      disabled={!canEditTemplates}
                      onClick={(event) => handleEditClick(event, template)}
                    />
                  )}

                  <BaseActionButton
                    icon={<CopyOutlined />}
                    title={t("configuration-templates.source.duplicate-template")}
                    disabled={!canDuplicateTemplates}
                    onClick={(event) => handleDuplicateClick(event, template)}
                  />
                </Flex>
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
