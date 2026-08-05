import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";

export type TemplateTitleSortable = Pick<TaskTemplatePublicSchema, "title" | "name">;

export function getTemplateSortableTitle(
  template: TemplateTitleSortable,
  language: string
): string {
  return getTemplateTitleText(template.title, language) || template.name;
}

export function compareTemplatesByTitle(
  first: TemplateTitleSortable,
  second: TemplateTitleSortable,
  language: string
): number {
  return getTemplateSortableTitle(first, language).localeCompare(
    getTemplateSortableTitle(second, language),
    language
  );
}

export function sortTemplatesByTitle<T extends TemplateTitleSortable>(
  templates: T[],
  language: string
): T[] {
  return [...templates].sort((first, second) => compareTemplatesByTitle(first, second, language));
}
