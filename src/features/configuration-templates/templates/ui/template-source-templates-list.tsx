import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  isGlobalServerError,
  SearchHighlightText,
} from "@saltbox/saltbox-frontend-common";
import { Flex, List, Tag, message } from "antd";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { isBgTaskFailedError } from "../../shared/errors/bg-task-failed.error";
import { isBgTaskPollAborted } from "../../shared/errors/bg-task-poll-aborted.error";
import { resolveTemplateDescription } from "../../shared/helpers/resolve-template-description";
import {
  getDuplicateTemplatePath,
  getEditTemplatePath,
} from "../../shared/helpers/source-presentation";
import { TemplateSourceSectionEmpty } from "../../shared/ui/template-source-section-empty";
import { useConfirmDeleteTemplate } from "../hooks/use-confirm-delete-template";

import styles from "./template-source-templates-list.module.css";

export type TemplateSourceTemplatesListProps = {
  items: TaskTemplatePublicSchema[];
  constrainHeight?: boolean;
  searchQuery?: string;
  showEditTemplate?: boolean;
  canEditTemplates?: boolean;
  canDuplicateTemplates?: boolean;
  showDeleteTemplate?: boolean;
  canDeleteTemplates?: boolean;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
};

export function TemplateSourceTemplatesList({
  items,
  constrainHeight = true,
  searchQuery,
  showEditTemplate = false,
  canEditTemplates = false,
  canDuplicateTemplates = false,
  showDeleteTemplate = false,
  canDeleteTemplates = false,
  onDeleteTemplate,
  onDeleteError,
}: TemplateSourceTemplatesListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { confirmDeleteTemplate, modalContextHolder } = useConfirmDeleteTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingIdRef = useRef<string | null>(null);

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

  const handleDelete = useCallback(
    async (template: TaskTemplatePublicSchema) => {
      if (!onDeleteTemplate || deletingIdRef.current !== null) return;

      deletingIdRef.current = template.id;
      setDeletingId(template.id);
      try {
        await onDeleteTemplate(template.id);
        message.success(
          t("configuration-templates.source.template-delete-success", {
            title: template.title,
          })
        );
      } catch (error) {
        if (isGlobalServerError(error) || isBgTaskPollAborted(error)) return;

        if (isBgTaskFailedError(error)) {
          message.error(t("configuration-templates.source.template-delete-error"));
          await onDeleteError?.();
          return;
        }

        console.error(error);
        message.error(t("configuration-templates.source.template-delete-error"));
        await onDeleteError?.();
      } finally {
        deletingIdRef.current = null;
        setDeletingId(null);
      }
    },
    [onDeleteError, onDeleteTemplate, t]
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLElement>, template: TaskTemplatePublicSchema) => {
      event.stopPropagation();
      confirmDeleteTemplate({
        title: template.title,
        onOk: () => handleDelete(template),
      });
    },
    [confirmDeleteTemplate, handleDelete]
  );

  return (
    <>
      {modalContextHolder}
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

                    {showDeleteTemplate && onDeleteTemplate && (
                      <BaseActionButton
                        color="danger"
                        icon={<DeleteOutlined />}
                        title={t("configuration-templates.source.delete-template")}
                        loading={deletingId === template.id}
                        disabled={!canDeleteTemplates}
                        onClick={(event) => handleDeleteClick(event, template)}
                      />
                    )}
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
    </>
  );
}
