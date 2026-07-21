import {
  canRenderInVisualEditor,
  type FormSchema,
  type JSONSchema,
  type UISchema,
  type VisualEditorCompatibilityResult,
} from "@saltbox/react-jsonschema-form-generator";

import type { TemplateFormSchema } from "./sls-parser";

export function extractPillarSchema(
  jsonSchema: JSONSchema,
  rootDescription: TemplateFormSchema["description"]
): JSONSchema {
  if (typeof jsonSchema === "boolean") {
    return { type: "object", properties: {} };
  }

  const kwargs = jsonSchema?.properties?.kwargs as JSONSchema | undefined;
  if (!kwargs || typeof kwargs !== "object") {
    return {
      type: "object",
      properties: {},
      title: jsonSchema.title,
      description: rootDescription,
    };
  }

  const pillar = kwargs.properties?.pillar as JSONSchema | undefined;
  if (!pillar || typeof pillar !== "object") {
    return {
      type: "object",
      properties: {},
      title: jsonSchema.title,
      description: rootDescription,
    };
  }

  return {
    ...pillar,
    title: pillar.title || jsonSchema.title,
    description: rootDescription,
  };
}

export function extractPillarUiSchema(uiSchema: UISchema): UISchema {
  const kwargs = uiSchema?.kwargs as Record<string, unknown> | undefined;
  if (!kwargs || typeof kwargs !== "object") return {};
  return ((kwargs as Record<string, unknown>).pillar || {}) as UISchema;
}

/**
 * The visual editor keeps the root description inside `json_schema`, while the
 * template stores it in the schema block root — bridge the two here.
 */
export function extractPillarFormSchema(schema: TemplateFormSchema): FormSchema {
  return {
    json_schema: extractPillarSchema(schema.json_schema, schema.description),
    ui_schema: extractPillarUiSchema(schema.ui_schema),
  };
}

export function wrapPillarFormSchema(
  schema: TemplateFormSchema,
  editedSchemaOrFormSchema: JSONSchema | FormSchema
): TemplateFormSchema {
  const {
    json_schema: jsonSchema,
    ui_schema: uiSchema,
    description: _description,
    ...rest
  } = schema;

  let editedSchema: JSONSchema;
  let editedUiSchema: UISchema = {};

  if (
    typeof editedSchemaOrFormSchema === "object" &&
    editedSchemaOrFormSchema !== null &&
    "json_schema" in editedSchemaOrFormSchema
  ) {
    const formSchema = editedSchemaOrFormSchema as FormSchema;
    editedSchema = formSchema.json_schema;
    editedUiSchema = formSchema.ui_schema || {};
  } else {
    editedSchema = editedSchemaOrFormSchema as JSONSchema;
  }

  const rootTitle =
    typeof editedSchema === "object" && editedSchema !== null ? editedSchema.title : undefined;
  const rootDescription =
    typeof editedSchema === "object" && editedSchema !== null
      ? editedSchema.description
      : undefined;

  const pillarSchema =
    typeof editedSchema === "object" && editedSchema !== null
      ? (() => {
          const { title: _title, description: _pillarDescription, ...pillarRest } = editedSchema;
          return pillarRest;
        })()
      : editedSchema;

  const { description: _staleDescription, ...baseJsonSchema } =
    typeof jsonSchema === "boolean" || jsonSchema == null ? { description: undefined } : jsonSchema;

  // `description` intentionally stays out of `json_schema`: it belongs to the
  // schema block root, and RJSF cannot render a localized ({ ru, en }) value
  const wrappedJsonSchema: JSONSchema = {
    ...baseJsonSchema,
    type: "object",
    title: rootTitle || "",
    additionalProperties: false,
    required: ["kwargs"],
    properties: {
      kwargs: {
        type: "object",
        additionalProperties: false,
        required: ["pillar"],
        properties: {
          pillar: pillarSchema,
        },
      },
    },
  };

  const wrappedUiSchema: UISchema = {
    ...(typeof uiSchema === "object" && uiSchema !== null ? uiSchema : {}),
    kwargs: {
      ...(typeof uiSchema?.kwargs === "object" && uiSchema.kwargs !== null ? uiSchema.kwargs : {}),
      pillar: editedUiSchema,
    },
  };

  return {
    ...(isEmptyDescription(rootDescription) ? {} : { description: rootDescription }),
    json_schema: wrappedJsonSchema,
    ui_schema: wrappedUiSchema,
    ...rest,
  };
}

function isEmptyDescription(description: TemplateFormSchema["description"]): boolean {
  if (description == null) return true;
  if (typeof description === "string") return description.trim() === "";
  return !Object.values(description).some((text) => text?.trim());
}

/**
 * A localized description left inside `json_schema` by an older build: RJSF
 * would try to render the object and crash, so the visual editor is disabled
 * until the template is fixed through the full editor.
 */
export function hasUnsupportedSchemaDescription(schema: TemplateFormSchema): boolean {
  const jsonSchema = schema.json_schema;
  if (typeof jsonSchema === "boolean" || jsonSchema == null) return false;

  return jsonSchema.description != null && typeof jsonSchema.description !== "string";
}

export function getPillarCompatibility(
  schema: TemplateFormSchema
): VisualEditorCompatibilityResult {
  return canRenderInVisualEditor(extractPillarFormSchema(schema));
}
