import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export async function fetchTemplateSource(
  sourceId: string
): Promise<SourceListWithExtrasSchema | null> {
  return (
    (await apiCoreStore.taskTemplateSourcesApi?.templateSourceGet({ source_id: sourceId })) ?? null
  );
}
