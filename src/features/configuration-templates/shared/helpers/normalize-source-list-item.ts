import type {
  SourceListWithExtrasSchema,
  TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

function resolveSourceExtras<T>(
  incoming: T[] | null | undefined,
  fallback: T[] | null | undefined
): T[] {
  return incoming ?? fallback ?? [];
}

export function normalizeSourceListItem(
  source: TemplateSourcePublicSchema | SourceListWithExtrasSchema
): SourceListWithExtrasSchema {
  const withExtras = source as SourceListWithExtrasSchema;

  return {
    ...source,
    templates: resolveSourceExtras(withExtras.templates, undefined),
    files: resolveSourceExtras(withExtras.files, undefined),
  };
}

export function mergeSourceListItemUpdate(
  current: SourceListWithExtrasSchema,
  updated: TemplateSourcePublicSchema | SourceListWithExtrasSchema
): SourceListWithExtrasSchema {
  const { templates, files, ...updatedRest } = updated as SourceListWithExtrasSchema;

  return {
    ...current,
    ...updatedRest,
    templates: resolveSourceExtras(templates, current.templates),
    files: resolveSourceExtras(files, current.files),
  };
}
