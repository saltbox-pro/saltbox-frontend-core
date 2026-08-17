import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

import { compareTemplatesByTitle } from "saltbox-core/features/template-source-search";

export type TemplateAccessibilitySortable = Pick<TaskTemplatePublicSchema, "title" | "name"> & {
  isAccessible: boolean;
};

export function compareTemplatesByAccessibilityThenTitle(
  first: TemplateAccessibilitySortable,
  second: TemplateAccessibilitySortable,
  language: string
): number {
  if (first.isAccessible !== second.isAccessible) {
    return first.isAccessible ? -1 : 1;
  }

  return compareTemplatesByTitle(first, second, language);
}

export function sortTemplatesByAccessibilityThenTitle<T extends TemplateAccessibilitySortable>(
  templates: T[],
  language: string
): T[] {
  return [...templates].sort((first, second) =>
    compareTemplatesByAccessibilityThenTitle(first, second, language)
  );
}
