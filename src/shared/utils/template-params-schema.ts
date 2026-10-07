import type { RJSFSchema } from "@rjsf/utils";
import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { localizeTemplateUiSchema } from "@saltbox/saltbox-frontend-common";

import { isFieldlessSchema, toRjsfSchema, toTemplateSchemaSource } from "./template-rjsf-schema";

export type TemplateParamsSchema = {
  jsonSchema: RJSFSchema | undefined;
  uiSchema: TaskTemplateModel["ui_schema"];
  isFieldless: boolean;
};

export function getTemplateParamsSchema(
  template: TaskTemplateModel | undefined,
  language: string
): TemplateParamsSchema {
  if (!template) {
    return { jsonSchema: undefined, uiSchema: undefined, isFieldless: true };
  }

  const jsonSchema = toRjsfSchema(toTemplateSchemaSource(template), language);

  return {
    jsonSchema,
    uiSchema: localizeTemplateUiSchema(template.ui_schema, template.i18n, language),
    isFieldless: isFieldlessSchema(jsonSchema),
  };
}
