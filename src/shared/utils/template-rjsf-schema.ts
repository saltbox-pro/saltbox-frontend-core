import type { FormContextType, RJSFSchema, UiSchema } from "@rjsf/utils";
import { resolveLocalizedText, type UISchema } from "@saltbox/react-jsonschema-form-generator";
import type { LocalizedTextValue } from "@saltbox/saltbox-frontend-common";

export type TemplateSchemaSource = {
  description?: LocalizedTextValue;
  json_schema?: unknown;
};

export function toTemplateSchemaSource(source: {
  description?: unknown;
  json_schema?: unknown;
}): TemplateSchemaSource {
  return {
    description: source.description as LocalizedTextValue | undefined,
    json_schema: source.json_schema,
  };
}

const TYPE_HINT_KEYWORDS = [
  "type",
  "properties",
  "patternProperties",
  "additionalProperties",
  "items",
  "enum",
  "const",
  "oneOf",
  "anyOf",
  "allOf",
  "$ref",
] as const;

const MAX_SCHEMA_DEPTH = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function ensureRenderableSchema(schema: RJSFSchema): RJSFSchema {
  if (!isRecord(schema)) {
    return schema;
  }

  if (TYPE_HINT_KEYWORDS.some((keyword) => keyword in schema)) {
    return schema;
  }

  return { ...schema, type: "object" };
}

export function isFieldlessSchema(schema: unknown, depth = 0): boolean {
  if (schema == null || typeof schema === "boolean") {
    return true;
  }

  if (!isRecord(schema)) {
    return false;
  }

  if (depth > MAX_SCHEMA_DEPTH) {
    return false;
  }

  if (
    schema.enum != null ||
    "const" in schema ||
    schema.$ref != null ||
    schema.oneOf != null ||
    schema.anyOf != null ||
    schema.allOf != null ||
    schema.items != null ||
    schema.patternProperties != null
  ) {
    return false;
  }

  if ("additionalProperties" in schema && schema.additionalProperties !== false) {
    return false;
  }

  if (schema.type != null && schema.type !== "object") {
    return false;
  }

  if (!isRecord(schema.properties)) {
    return true;
  }

  return Object.values(schema.properties).every((property) =>
    isFieldlessSchema(property, depth + 1)
  );
}

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

  return ensureRenderableSchema((description ? { ...rest, description } : rest) as RJSFSchema);
}

export function toRjsfUiSchema(
  uiSchema: UISchema
): UiSchema<Record<string, unknown>, RJSFSchema, FormContextType> {
  return uiSchema as UiSchema<Record<string, unknown>, RJSFSchema, FormContextType>;
}
