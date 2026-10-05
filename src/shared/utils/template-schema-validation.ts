import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { validateTemplateJsonSchemas } from "@saltbox/saltbox-frontend-common";

import { toRjsfSchema, toTemplateSchemaSource } from "./template-rjsf-schema";

export function getTemplateSchemaError(template: TaskTemplateModel, language: string) {
  return validateTemplateJsonSchemas({
    rawSchema: template.json_schema,
    rjsfSchema: toRjsfSchema(toTemplateSchemaSource(template), language),
    schemaPath: template.schema_rel_path || undefined,
  });
}
