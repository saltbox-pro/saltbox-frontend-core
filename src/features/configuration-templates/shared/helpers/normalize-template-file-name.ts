import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

export function normalizeTemplateFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/\.sls$/i, "")
    .toLowerCase();
}

export function findTemplateIdByFileName(
  templates: TaskTemplatePublicSchema[],
  fileName: string
): string | null {
  const normalizedTarget = normalizeTemplateFileName(fileName);

  return (
    templates.find((template) => normalizeTemplateFileName(template.name) === normalizedTarget)
      ?.id ?? null
  );
}
