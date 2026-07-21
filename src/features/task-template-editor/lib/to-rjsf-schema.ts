import type { FormContextType, RJSFSchema, UiSchema } from "@rjsf/utils";
import { resolveLocalizedText, type UISchema } from "@saltbox/react-jsonschema-form-generator";

import type { TemplateFormSchema } from "./sls-parser";

/**
 * The template description lives in the schema block root and may be stored per
 * language ({ ru, en }), which RJSF cannot render — resolve it to the active
 * language and hand it over as the schema description. A localized description
 * left inside `json_schema` by an older build is dropped for the same reason.
 */
export function toRjsfSchema(schema: TemplateFormSchema, language: string): RJSFSchema {
  const jsonSchema = schema.json_schema;

  if (typeof jsonSchema === "boolean" || jsonSchema == null) {
    return jsonSchema as RJSFSchema;
  }

  const { description: rawDescription, ...rest } = jsonSchema;
  const description = resolveLocalizedText(schema.description ?? rawDescription, language);

  return (description ? { ...rest, description } : rest) as RJSFSchema;
}

export function toRjsfUiSchema(
  uiSchema: UISchema
): UiSchema<Record<string, unknown>, RJSFSchema, FormContextType> {
  return uiSchema as UiSchema<Record<string, unknown>, RJSFSchema, FormContextType>;
}
