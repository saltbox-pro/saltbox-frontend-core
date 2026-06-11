import type { FormContextType, RJSFSchema, UiSchema } from "@rjsf/utils";
import type { JSONSchema, UISchema } from "@saltbox/react-jsonschema-form-generator";

export function toRjsfSchema(schema: JSONSchema): RJSFSchema {
  return schema as RJSFSchema;
}

export function toRjsfUiSchema(
  uiSchema: UISchema
): UiSchema<Record<string, unknown>, RJSFSchema, FormContextType> {
  return uiSchema as UiSchema<Record<string, unknown>, RJSFSchema, FormContextType>;
}
