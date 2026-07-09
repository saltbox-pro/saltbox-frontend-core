import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

import type { TemplateSourceNavigationState } from "../types/template-source-navigation-state";

import { findTemplateIdByFileName } from "./normalize-template-file-name";

export function resolveHighlightedTemplateId(
  navigationState: TemplateSourceNavigationState | null | undefined,
  templates: TaskTemplatePublicSchema[] | undefined
): string | null {
  if (navigationState?.highlightedTemplateId) {
    return navigationState.highlightedTemplateId;
  }

  const highlightedTemplateName = navigationState?.highlightedTemplateName;
  if (!highlightedTemplateName || templates === undefined) {
    return null;
  }

  return findTemplateIdByFileName(templates, highlightedTemplateName);
}
