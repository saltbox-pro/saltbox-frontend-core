import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { useCallback, useRef, useState } from "react";

import {
  TemplateSourceTemplatesList,
  type TemplateSourceTemplatesListProps,
  useConfirmDeleteTemplate,
} from "saltbox-core/features/template-source-ui";

import type { SourceTemplateActionsPermissions } from "../helpers/source-template-actions";

import { TemplateItemActions } from "./template-item-actions";

export type TemplateSourceTemplatesListSectionProps = Omit<
  TemplateSourceTemplatesListProps,
  "renderItemActions"
> & {
  permissions: SourceTemplateActionsPermissions;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
  onDeleteTemplateSuccess?: (templateId: string) => void;
};

export function TemplateSourceTemplatesListSection({
  permissions,
  onDeleteTemplate,
  onDeleteError,
  onDeleteTemplateSuccess,
  ...listProps
}: TemplateSourceTemplatesListSectionProps) {
  const { confirmDeleteTemplate, modalContextHolder } = useConfirmDeleteTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingIdRef = useRef<string | null>(null);

  const renderItemActions = useCallback(
    (template: TaskTemplatePublicSchema) => (
      <TemplateItemActions
        template={template}
        permissions={permissions}
        confirmDeleteTemplate={confirmDeleteTemplate}
        stopPropagation
        onDeleteTemplate={onDeleteTemplate}
        onDeleteError={onDeleteError}
        onDeleteTemplateSuccess={
          onDeleteTemplateSuccess ? () => onDeleteTemplateSuccess(template.id) : undefined
        }
        isDeleting={deletingId === template.id}
        isDeleteBlocked={deletingId !== null && deletingId !== template.id}
        onDeletingStart={() => {
          if (deletingIdRef.current !== null) {
            return false;
          }

          deletingIdRef.current = template.id;
          setDeletingId(template.id);
          return true;
        }}
        onDeletingEnd={() => {
          deletingIdRef.current = null;
          setDeletingId(null);
        }}
      />
    ),
    [
      confirmDeleteTemplate,
      deletingId,
      onDeleteError,
      onDeleteTemplate,
      onDeleteTemplateSuccess,
      permissions,
    ]
  );

  return (
    <>
      {modalContextHolder}
      <TemplateSourceTemplatesList {...listProps} renderItemActions={renderItemActions} />
    </>
  );
}
