import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { getLocalizedText } from "@saltbox/saltbox-frontend-common";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { ConfirmDeleteTemplate } from "saltbox-core/features/template-source-ui";

import type { SourceTemplateActionsPermissions } from "../helpers/source-template-actions";
import {
  navigateToDuplicateTemplate,
  navigateToEditTemplate,
} from "../helpers/template-item-navigation";
import { deleteTemplateItem } from "../service/delete-template-item.service";

export type UseTemplateItemActionsOptions = {
  template: TaskTemplatePublicSchema;
  permissions: SourceTemplateActionsPermissions;
  confirmDeleteTemplate: ConfirmDeleteTemplate;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
  onAfterNavigate?: () => void;
  onDeleteTemplateSuccess?: () => void;
  isDeleting?: boolean;
  isDeleteBlocked?: boolean;
  onDeletingStart?: () => boolean;
  onDeletingEnd?: () => void;
};

export function useTemplateItemActions({
  template,
  permissions,
  confirmDeleteTemplate,
  onDeleteTemplate,
  onDeleteError,
  onAfterNavigate,
  onDeleteTemplateSuccess,
  isDeleting: isDeletingControlled,
  isDeleteBlocked = false,
  onDeletingStart,
  onDeletingEnd,
}: UseTemplateItemActionsOptions): {
  isDeleting: boolean;
  handleEdit: () => void;
  handleDuplicate: () => void;
  handleDeleteClick: () => void;
} {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isDeletingInternal, setIsDeletingInternal] = useState(false);
  const isDeletingRef = useRef(false);
  const isDeleting = isDeletingControlled ?? isDeletingInternal;
  const templateTitle = getLocalizedText(template.title, i18n.language) || template.name;

  const handleEdit = useCallback(() => {
    navigateToEditTemplate(template, permissions, navigate, onAfterNavigate);
  }, [navigate, onAfterNavigate, permissions, template]);

  const handleDuplicate = useCallback(() => {
    navigateToDuplicateTemplate(template, permissions, navigate, onAfterNavigate);
  }, [navigate, onAfterNavigate, permissions, template]);

  const handleDelete = useCallback(async () => {
    if (!onDeleteTemplate || isDeletingRef.current || isDeleteBlocked) return;
    if (onDeletingStart && !onDeletingStart()) return;

    isDeletingRef.current = true;
    if (isDeletingControlled === undefined) {
      setIsDeletingInternal(true);
    }

    try {
      await deleteTemplateItem({
        template,
        templateTitle,
        onDelete: onDeleteTemplate,
        onDeleteError,
        onSuccess: onDeleteTemplateSuccess,
        t,
      });
    } finally {
      isDeletingRef.current = false;
      if (isDeletingControlled === undefined) {
        setIsDeletingInternal(false);
      }
      onDeletingEnd?.();
    }
  }, [
    isDeleteBlocked,
    isDeletingControlled,
    onDeleteError,
    onDeleteTemplate,
    onDeleteTemplateSuccess,
    onDeletingEnd,
    onDeletingStart,
    t,
    template,
    templateTitle,
  ]);

  const handleDeleteClick = useCallback(() => {
    if (!onDeleteTemplate || isDeleteBlocked) return;

    confirmDeleteTemplate({
      title: templateTitle,
      onOk: handleDelete,
    });
  }, [confirmDeleteTemplate, handleDelete, isDeleteBlocked, onDeleteTemplate, templateTitle]);

  return {
    isDeleting,
    handleEdit,
    handleDuplicate,
    handleDeleteClick,
  };
}
