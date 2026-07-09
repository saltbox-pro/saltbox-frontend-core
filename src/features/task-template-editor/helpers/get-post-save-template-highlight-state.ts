import type { TemplateSourceNavigationState } from "saltbox-core/features/configuration-templates/shared/types/template-source-navigation-state";

export function getPostSaveTemplateHighlightState(
  mode: "create" | "edit" | "duplicate",
  templateId: string | undefined,
  fileName: string
): TemplateSourceNavigationState | undefined {
  if (mode === "edit" && templateId) {
    return { highlightedTemplateId: templateId };
  }

  if (mode !== "edit" && fileName) {
    return { highlightedTemplateName: fileName };
  }

  return undefined;
}
