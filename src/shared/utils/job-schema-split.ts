export type JsonSchemaRecord = Record<string, unknown>;
export type UiSchemaRecord = Record<string, unknown>;

export type JobParamsSchemaLayout = {
  displaySchema: JsonSchemaRecord | null;
  displayUiSchema: UiSchemaRecord | undefined;
};

type SplitSchemaResult = {
  requiredSchema: JsonSchemaRecord | null;
  optionalSchema: JsonSchemaRecord | null;
  requiredUiSchema: UiSchemaRecord | undefined;
  optionalUiSchema: UiSchemaRecord | undefined;
};

type SplitKwargsSchemaResult = {
  required: JsonSchemaRecord | null;
  optional: JsonSchemaRecord | null;
  requiredUi?: UiSchemaRecord;
  optionalUi?: UiSchemaRecord;
};

const isRecord = (value: unknown): value is JsonSchemaRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRequiredPropertyNames = (schema: JsonSchemaRecord): string[] => {
  const required = schema.required;
  return Array.isArray(required)
    ? required.filter((name): name is string => typeof name === "string")
    : [];
};

const isArrayFieldRequired = (schema: JsonSchemaRecord): boolean => {
  const minItems = schema.minItems;
  return typeof minItems === "number" && minItems >= 1;
};

const isTopLevelPropertyRequired = (
  propertyName: string,
  rootSchema: JsonSchemaRecord
): boolean => {
  const requiredPropertyNames = getRequiredPropertyNames(rootSchema);
  const propertySchema = rootSchema.properties?.[propertyName];

  return (
    requiredPropertyNames.includes(propertyName) ||
    (propertyName === "args" && isRecord(propertySchema) && isArrayFieldRequired(propertySchema))
  );
};

const pickUiSchemaFields = (
  uiSchema: UiSchemaRecord | undefined,
  propertyNames: string[]
): UiSchemaRecord | undefined => {
  if (!uiSchema) {
    return undefined;
  }

  const propertyNameSet = new Set(propertyNames);
  const pickedEntries = Object.entries(uiSchema).filter(([key]) => {
    if (key.startsWith("ui:")) {
      return true;
    }
    return propertyNameSet.has(key);
  });

  if (pickedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(pickedEntries);
};

const buildObjectSubsetSchema = (
  baseSchema: JsonSchemaRecord,
  properties: JsonSchemaRecord,
  required?: string[]
): JsonSchemaRecord | null => {
  if (Object.keys(properties).length === 0) {
    return null;
  }

  const subset: JsonSchemaRecord = {
    ...baseSchema,
    properties,
  };

  if (required && required.length > 0) {
    subset.required = required;
  } else {
    delete subset.required;
  }

  return subset;
};

const allowExtraFormDataInSubsetSchema = (schema: JsonSchemaRecord): JsonSchemaRecord => {
  const properties = schema.properties;
  if (!isRecord(properties)) {
    return {
      ...schema,
      additionalProperties: true,
    };
  }

  return {
    ...schema,
    additionalProperties: true,
    properties: Object.fromEntries(
      Object.entries(properties).map(([propertyName, propertySchema]) => {
        if (!isRecord(propertySchema)) {
          return [propertyName, propertySchema];
        }

        const isObjectSchema =
          propertySchema.type === "object" ||
          isRecord(propertySchema.properties) ||
          propertySchema.additionalProperties !== undefined;

        if (!isObjectSchema) {
          return [propertyName, propertySchema];
        }

        return [propertyName, allowExtraFormDataInSubsetSchema(propertySchema)];
      })
    ),
  };
};

export const toDisplayValidationSchema = (
  displaySchema: JsonSchemaRecord | null | undefined
): JsonSchemaRecord | null => {
  return displaySchema ? allowExtraFormDataInSubsetSchema(displaySchema) : null;
};

const splitKwargsSchema = (
  kwargsSchema: JsonSchemaRecord,
  uiKwargs?: UiSchemaRecord
): SplitKwargsSchemaResult => {
  const properties = kwargsSchema.properties;
  const hasNamedProperties = isRecord(properties) && Object.keys(properties).length > 0;

  if (!hasNamedProperties) {
    const requiredNames = getRequiredPropertyNames(kwargsSchema);
    if (requiredNames.length > 0) {
      return {
        required: kwargsSchema,
        optional: null,
        requiredUi: uiKwargs,
        optionalUi: undefined,
      };
    }

    return {
      required: null,
      optional: kwargsSchema,
      requiredUi: undefined,
      optionalUi: uiKwargs,
    };
  }

  const requiredPropertyNames = getRequiredPropertyNames(kwargsSchema);
  const requiredPropertyNameSet = new Set(requiredPropertyNames);
  const requiredProperties: JsonSchemaRecord = {};
  const optionalProperties: JsonSchemaRecord = {};

  Object.entries(properties).forEach(([propertyName, propertySchema]) => {
    if (requiredPropertyNameSet.has(propertyName)) {
      requiredProperties[propertyName] = propertySchema;
      return;
    }
    optionalProperties[propertyName] = propertySchema;
  });

  return {
    required: buildObjectSubsetSchema(kwargsSchema, requiredProperties, requiredPropertyNames),
    optional: buildObjectSubsetSchema(kwargsSchema, optionalProperties),
    requiredUi: pickUiSchemaFields(uiKwargs, requiredPropertyNames),
    optionalUi: pickUiSchemaFields(uiKwargs, Object.keys(optionalProperties)),
  };
};

const splitJobFunctionSchema = (
  jsonSchema: JsonSchemaRecord,
  uiSchema?: UiSchemaRecord | null
): SplitSchemaResult => {
  const rootProperties = jsonSchema.properties as JsonSchemaRecord;
  const requiredProperties: JsonSchemaRecord = {};
  const optionalProperties: JsonSchemaRecord = {};
  const requiredUiSchema: UiSchemaRecord = {};
  const optionalUiSchema: UiSchemaRecord = {};

  for (const [propertyName, propertySchema] of Object.entries(rootProperties)) {
    if (!isRecord(propertySchema)) {
      continue;
    }

    const propertyUiSchema = uiSchema?.[propertyName];
    const propertyUi = isRecord(propertyUiSchema) ? propertyUiSchema : undefined;

    if (propertyName === "kwargs") {
      const splitKwargs = splitKwargsSchema(propertySchema, propertyUi);

      if (splitKwargs.required) {
        requiredProperties[propertyName] = splitKwargs.required;
        if (splitKwargs.requiredUi) {
          requiredUiSchema[propertyName] = splitKwargs.requiredUi;
        }
      }

      if (splitKwargs.optional) {
        optionalProperties[propertyName] = splitKwargs.optional;
        if (splitKwargs.optionalUi) {
          optionalUiSchema[propertyName] = splitKwargs.optionalUi;
        }
      }
      continue;
    }

    if (isTopLevelPropertyRequired(propertyName, jsonSchema)) {
      requiredProperties[propertyName] = propertySchema;
      if (propertyUi) {
        requiredUiSchema[propertyName] = propertyUi;
      }
      continue;
    }

    optionalProperties[propertyName] = propertySchema;
    if (propertyUi) {
      optionalUiSchema[propertyName] = propertyUi;
    }
  }

  return {
    requiredSchema: buildObjectSubsetSchema(
      jsonSchema,
      requiredProperties,
      getRequiredPropertyNames(jsonSchema)
    ),
    optionalSchema: buildObjectSubsetSchema(jsonSchema, optionalProperties),
    requiredUiSchema: Object.keys(requiredUiSchema).length > 0 ? requiredUiSchema : undefined,
    optionalUiSchema: Object.keys(optionalUiSchema).length > 0 ? optionalUiSchema : undefined,
  };
};

export const hasJsonSchemaProperties = (schema: JsonSchemaRecord | null | undefined): boolean => {
  return !!schema && isRecord(schema.properties) && Object.keys(schema.properties).length > 0;
};

export const getJobParamsSchemaLayout = (
  jsonSchema: JsonSchemaRecord | null | undefined,
  uiSchema: UiSchemaRecord | null | undefined,
  isAdvancedSettingsEnabled: boolean
): JobParamsSchemaLayout => {
  if (!hasJsonSchemaProperties(jsonSchema)) {
    return {
      displaySchema: null,
      displayUiSchema: undefined,
    };
  }

  if (isAdvancedSettingsEnabled) {
    return {
      displaySchema: jsonSchema,
      displayUiSchema: uiSchema ?? undefined,
    };
  }

  const split = splitJobFunctionSchema(jsonSchema, uiSchema);

  return {
    displaySchema: split.requiredSchema,
    displayUiSchema: split.requiredUiSchema,
  };
};

const normalizeValidationPropertyPath = (propertyPath: string): string => {
  const trimmed = propertyPath.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
};

const getValidationPathSegments = (propertyPath: string): string[] => {
  const normalizedPath = normalizeValidationPropertyPath(propertyPath);
  if (!normalizedPath) {
    return [];
  }

  return normalizedPath
    .slice(1)
    .split(/\.|\[|\]/)
    .filter((segment) => segment !== "");
};

const resolveSchemaAtPath = (
  schema: JsonSchemaRecord,
  segments: string[]
): JsonSchemaRecord | null => {
  let currentSchema: JsonSchemaRecord | null = schema;

  for (const segment of segments) {
    if (!currentSchema) {
      return null;
    }

    if (/^\d+$/.test(segment)) {
      const itemsSchema = currentSchema.items;
      if (!isRecord(itemsSchema) || Array.isArray(itemsSchema)) {
        return null;
      }
      currentSchema = itemsSchema;
      continue;
    }

    const properties = currentSchema.properties;
    if (!isRecord(properties) || !(segment in properties)) {
      return null;
    }

    const childSchema = properties[segment];
    if (!isRecord(childSchema)) {
      return null;
    }

    currentSchema = childSchema;
  }

  return currentSchema;
};

export const isValidationErrorCoveredByDisplaySchema = (
  error: { property?: string },
  displaySchema: JsonSchemaRecord | null | undefined
): boolean => {
  if (!displaySchema) {
    return false;
  }

  const segments = getValidationPathSegments(error.property ?? "");
  if (segments.length === 0) {
    return false;
  }

  return resolveSchemaAtPath(displaySchema, segments) !== null;
};

export const shouldOpenAdvancedSettingsForValidationErrors = (
  errors: { property?: string }[],
  displaySchema: JsonSchemaRecord | null | undefined
): boolean => {
  return errors.some((error) => !isValidationErrorCoveredByDisplaySchema(error, displaySchema));
};
