import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

export type TemplateTitleSortable = Pick<TaskTemplatePublicSchema, "title" | "name">;

export function compareTemplatesByTitle(
  first: TemplateTitleSortable,
  second: TemplateTitleSortable
): number {
  return (first.title || first.name).localeCompare(second.title || second.name);
}

export function sortTemplatesByTitle<T extends TemplateTitleSortable>(templates: T[]): T[] {
  return [...templates].sort(compareTemplatesByTitle);
}
