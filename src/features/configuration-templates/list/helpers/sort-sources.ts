import { SourceType, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

function compareSourceCreatedDesc(
  a: TemplateSourcePublicSchema,
  b: TemplateSourcePublicSchema
): number {
  const aTime = Date.parse(a.created);
  const bTime = Date.parse(b.created);

  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;

  return bTime - aTime;
}

export function sortSources(sources: TemplateSourcePublicSchema[]): TemplateSourcePublicSchema[] {
  return [...sources].sort((a, b) => {
    const aIsLocal = a.source_type === SourceType.LocalBundle;
    const bIsLocal = b.source_type === SourceType.LocalBundle;

    if (aIsLocal !== bIsLocal) return aIsLocal ? -1 : 1;

    return compareSourceCreatedDesc(a, b);
  });
}
