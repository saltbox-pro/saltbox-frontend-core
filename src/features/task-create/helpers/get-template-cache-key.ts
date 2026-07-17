import type { SelectedTaskTemplate } from "../type/types";

export function getTemplateCacheKey(template: SelectedTaskTemplate): string {
  return `${template.sourceId}:${template.templateId}`;
}
