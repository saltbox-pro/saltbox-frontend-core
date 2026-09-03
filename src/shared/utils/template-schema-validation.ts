import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { validateTemplateJsonSchemas } from "@saltbox/saltbox-frontend-common";

import { toRjsfSchema } from "./template-rjsf-schema";

export function getTemplateSchemaError(template: TaskTemplateModel, language: string) {
  return validateTemplateJsonSchemas({
    rawSchema: template.json_schema,
    rjsfSchema: toRjsfSchema(template, language),
    schemaPath: template.schema_rel_path || undefined,
  });
}
