import type { FormContextType, RJSFSchema, UiSchema } from "@rjsf/utils";
import { resolveLocalizedText, type UISchema } from "@saltbox/react-jsonschema-form-generator";

import type { LocalizedTextValue } from "./template-localized-text";

export type TemplateSchemaSource = {
  description?: LocalizedTextValue;
  json_schema?: unknown;
};

export function toRjsfSchema(schema: TemplateSchemaSource, language: string): RJSFSchema {
  const jsonSchema = schema.json_schema as Record<string, unknown> | boolean | null | undefined;

  if (typeof jsonSchema === "boolean" || jsonSchema == null) {
    return jsonSchema as RJSFSchema;
  }

  const { description: rawDescription, ...rest } = jsonSchema;
  const description = resolveLocalizedText(
    (schema.description ?? rawDescription) as Parameters<typeof resolveLocalizedText>[0],
    language
  );

  return (description ? { ...rest, description } : rest) as RJSFSchema;
}

export function toRjsfUiSchema(
  uiSchema: UISchema
): UiSchema<Record<string, unknown>, RJSFSchema, FormContextType> {
  return uiSchema as UiSchema<Record<string, unknown>, RJSFSchema, FormContextType>;
}
