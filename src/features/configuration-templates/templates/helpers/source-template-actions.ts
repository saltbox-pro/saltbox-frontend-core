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
  duplicateDisabledReason?: "no-connected-local-source" | "source-busy";
  showDelete: boolean;
  canDelete: boolean;
};

type SourceForTemplateActions = Pick<
  TemplateSourcePublicSchema,
  "source_type" | "id" | "current_operation"
>;

type SourceTemplateActionsOptions = {
  hasConnectedLocalSource?: boolean;
};

export function getSourceTemplateActionsPermissions(
  source: SourceForTemplateActions,
  actionState?: SourceActionState,
  options?: SourceTemplateActionsOptions
): SourceTemplateActionsPermissions {
  const hasConnectedLocalSource = options?.hasConnectedLocalSource ?? true;
  const sourceIsFree = canDuplicateSourceTemplate(source, actionState);
  const canDuplicate = sourceIsFree && hasConnectedLocalSource;

  let duplicateDisabledReason: SourceTemplateActionsPermissions["duplicateDisabledReason"];
  if (!canDuplicate) {
    duplicateDisabledReason = !hasConnectedLocalSource
      ? "no-connected-local-source"
      : "source-busy";
  }

  return {
    showEdit: isEditableTemplateSource(source),
    canEdit: canEditSourceTemplates(source, actionState),
    showDuplicate: true,
    canDuplicate,
    duplicateDisabledReason,
    showDelete: isDeletableTemplateSource(source),
    canDelete: canDeleteSourceTemplates(source, actionState),
  };
}
