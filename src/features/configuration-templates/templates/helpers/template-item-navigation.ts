import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import type { NavigateFunction } from "react-router";

import {
  getDuplicateTemplatePath,
  getEditTemplatePath,
} from "../../shared/helpers/source-presentation";

import type { SourceTemplateActionsPermissions } from "./source-template-actions";

type TemplateRef = Pick<TaskTemplatePublicSchema, "source_id" | "id">;

export function navigateToEditTemplate(
  template: TemplateRef,
  permissions: SourceTemplateActionsPermissions,
  navigate: NavigateFunction,
  onAfterNavigate?: () => void
): void {
  if (!permissions.canEdit) {
    return;
  }

  navigate(getEditTemplatePath(template.source_id, template.id));
  onAfterNavigate?.();
}

export function navigateToDuplicateTemplate(
  template: TemplateRef,
  permissions: SourceTemplateActionsPermissions,
  navigate: NavigateFunction,
  onAfterNavigate?: () => void
): void {
  if (!permissions.canDuplicate) {
    return;
  }

  navigate(getDuplicateTemplatePath(template.source_id, template.id));
  onAfterNavigate?.();
}
