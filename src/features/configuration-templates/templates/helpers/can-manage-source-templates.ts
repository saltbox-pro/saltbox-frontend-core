import { SourceType, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import {
  getSourceActionContext,
  isDeleteLocalTemplateSourceOperation,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionState } from "../../shared/types/source-action";

type ManageTemplatesSource = Pick<
  TemplateSourcePublicSchema,
  "id" | "source_type" | "current_operation"
>;

function isSourceFree(
  source: Pick<TemplateSourcePublicSchema, "id" | "current_operation">,
  actionState?: SourceActionState
): boolean {
  if (actionState) {
    const { actionKind } = getSourceActionContext(actionState, source.id);
    if (actionKind !== null && actionKind !== "delete_template") {
      return false;
    }
  }

  if (source.current_operation !== null) {
    return isDeleteLocalTemplateSourceOperation(source.current_operation);
  }

  return true;
}

export function isEditableTemplateSource(
  source: Pick<TemplateSourcePublicSchema, "source_type">
): boolean {
  return source.source_type === SourceType.LocalBundle;
}

export function isDeletableTemplateSource(
  source: Pick<TemplateSourcePublicSchema, "source_type">
): boolean {
  return (
    source.source_type === SourceType.LocalBundle || source.source_type === SourceType.ArchiveBundle
  );
}

export function canEditSourceTemplates(
  source: ManageTemplatesSource,
  actionState?: SourceActionState
): boolean {
  if (source.source_type !== SourceType.LocalBundle) {
    return false;
  }

  return isSourceFree(source, actionState);
}

export function canDuplicateSourceTemplate(
  source: ManageTemplatesSource,
  actionState?: SourceActionState
): boolean {
  return isSourceFree(source, actionState);
}

export function canDeleteSourceTemplates(
  source: ManageTemplatesSource,
  actionState?: SourceActionState
): boolean {
  if (!isDeletableTemplateSource(source)) {
    return false;
  }

  return isSourceFree(source, actionState);
}
