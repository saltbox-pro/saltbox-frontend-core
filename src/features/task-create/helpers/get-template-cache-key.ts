import type { SelectedTaskTemplate } from "../type/types";

export function getTemplateCacheKey(template: SelectedTaskTemplate): string {
  return template.kind === "template"
    ? `${template.sourceId}:${template.templateId}`
    : `custom-function:${template.fun}`;
}
