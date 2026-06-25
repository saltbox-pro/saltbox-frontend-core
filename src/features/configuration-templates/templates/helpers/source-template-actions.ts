import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import type { SourceActionState } from "../../shared/types/source-action";

import {
  canDeleteSourceTemplates,
  canDuplicateSourceTemplate,
  canEditSourceTemplates,
  isDeletableTemplateSource,
  isEditableTemplateSource,
} from "./can-manage-source-templates";

export type SourceTemplateActionsPermissions = {
  showEdit: boolean;
  canEdit: boolean;
  showDuplicate: boolean;
  canDuplicate: boolean;
  showDelete: boolean;
  canDelete: boolean;
};

type SourceForTemplateActions = Pick<
  TemplateSourcePublicSchema,
  "source_type" | "id" | "current_operation"
>;

export function getSourceTemplateActionsPermissions(
  source: SourceForTemplateActions,
  actionState?: SourceActionState
): SourceTemplateActionsPermissions {
  return {
    showEdit: isEditableTemplateSource(source),
    canEdit: canEditSourceTemplates(source, actionState),
    showDuplicate:
      canDuplicateSourceTemplate(source, actionState) ||
      isEditableTemplateSource(source) ||
      isDeletableTemplateSource(source),
    canDuplicate: canDuplicateSourceTemplate(source, actionState),
    showDelete: isDeletableTemplateSource(source),
    canDelete: canDeleteSourceTemplates(source, actionState),
  };
}
