import {
  canRenderInVisualEditor,
  type FormSchema,
  type JSONSchema,
  type UISchema,
  type VisualEditorCompatibilityResult,
} from "@saltbox/react-jsonschema-form-generator";

export function extractPillarSchema(jsonSchema: JSONSchema): JSONSchema {
  if (typeof jsonSchema === "boolean") {
    return { type: "object", properties: {} };
  }

  const kwargs = jsonSchema?.properties?.kwargs as JSONSchema | undefined;
  if (!kwargs || typeof kwargs !== "object") {
    return {
      type: "object",
      properties: {},
      title: jsonSchema.title,
      description: jsonSchema.description,
    };
  }

  const pillar = kwargs.properties?.pillar as JSONSchema | undefined;
  if (!pillar || typeof pillar !== "object") {
    return {
      type: "object",
      properties: {},
      title: jsonSchema.title,
      description: jsonSchema.description,
    };
  }

  return {
    ...pillar,
    title: pillar.title || jsonSchema.title,
    description: pillar.description || jsonSchema.description,
  };
}

export function extractPillarUiSchema(uiSchema: UISchema): UISchema {
  const kwargs = uiSchema?.kwargs as Record<string, unknown> | undefined;
  if (!kwargs || typeof kwargs !== "object") return {};
  return ((kwargs as Record<string, unknown>).pillar || {}) as UISchema;
}

export function extractPillarFormSchema(schema: FormSchema): FormSchema {
  return {
    json_schema: extractPillarSchema(schema.json_schema),
    ui_schema: extractPillarUiSchema(schema.ui_schema),
  };
}

export function wrapPillarFormSchema(
  jsonSchema: JSONSchema,
  uiSchema: UISchema,
  editedSchemaOrFormSchema: JSONSchema | FormSchema
): FormSchema {
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
          const { title: _title, description: _description, ...rest } = editedSchema;
          return rest;
        })()
      : editedSchema;

  const wrappedJsonSchema: JSONSchema = {
    ...(typeof jsonSchema === "boolean" ? {} : jsonSchema),
    type: "object",
    title: rootTitle || "",
    description: rootDescription,
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
    json_schema: wrappedJsonSchema,
    ui_schema: wrappedUiSchema,
  };
}

export function getPillarCompatibility(schema: FormSchema): VisualEditorCompatibilityResult {
  return canRenderInVisualEditor(extractPillarFormSchema(schema));
}
