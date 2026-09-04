import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import { trimOptional, trimRequired } from "../constants/template-source-name-description-form";
import type { UpdateTemplateSourcePayload } from "../types/update-template-source";

export async function updateTemplateSource(
  sourceId: string,
  payload: UpdateTemplateSourcePayload
): Promise<TemplateSourcePublicSchema> {
  const api = apiCoreStore.taskTemplateSourcesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  return api.templateSourceUpdate({
    source_id: sourceId,
    TemplateSourceUpdateSchema: {
      name: trimRequired(payload.name),
      description: trimOptional(payload.description) ?? "",
    },
  });
}
