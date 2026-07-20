import type { FormContextType, RJSFSchema, UiSchema } from "@rjsf/utils";
import {
  resolveLocalizedText,
  type JSONSchema,
  type UISchema,
} from "@saltbox/react-jsonschema-form-generator";

/**
 * The root description is stored per language ({ ru, en }), which RJSF cannot
 * render — resolve it to the active language before handing the schema over.
 */
export function toRjsfSchema(schema: JSONSchema, language: string): RJSFSchema {
  if (typeof schema === "boolean" || schema.description == null) {
    return schema as RJSFSchema;
  }

  return {
    ...schema,
    description: resolveLocalizedText(schema.description, language),
  } as RJSFSchema;
}

export function toRjsfUiSchema(
  uiSchema: UISchema
): UiSchema<Record<string, unknown>, RJSFSchema, FormContextType> {
  return uiSchema as UiSchema<Record<string, unknown>, RJSFSchema, FormContextType>;
}
