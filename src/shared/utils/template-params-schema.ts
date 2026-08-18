import type { RJSFSchema } from "@rjsf/utils";
import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import { isFieldlessSchema, toRjsfSchema } from "./template-rjsf-schema";
import { localizeUiSchema } from "./template-ui-schema-i18n";

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

  const jsonSchema = toRjsfSchema(template, language);

  return {
    jsonSchema,
    uiSchema: localizeUiSchema(template.ui_schema, template.i18n, language),
    isFieldless: isFieldlessSchema(jsonSchema),
  };
}
