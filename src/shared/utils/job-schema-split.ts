type JsonSchemaRecord = Record<string, unknown>;
type UiSchemaRecord = Record<string, unknown>;

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
  if (getRequiredPropertyNames(rootSchema).includes(propertyName)) {
    return true;
  }

  if (propertyName !== "args") {
    return false;
  }

  const propertySchema = rootSchema.properties?.[propertyName];
  return isRecord(propertySchema) && isArrayFieldRequired(propertySchema);
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

const splitKwargsSchema = (
  kwargsSchema: JsonSchemaRecord,
  uiKwargs?: UiSchemaRecord
): {
  required: JsonSchemaRecord | null;
  optional: JsonSchemaRecord | null;
  requiredUi?: UiSchemaRecord;
  optionalUi?: UiSchemaRecord;
} => {
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
  const requiredProperties: JsonSchemaRecord = {};
  const optionalProperties: JsonSchemaRecord = {};

  Object.entries(properties).forEach(([propertyName, propertySchema]) => {
    if (requiredPropertyNames.includes(propertyName)) {
      requiredProperties[propertyName] = propertySchema;
      return;
    }
    optionalProperties[propertyName] = propertySchema;
  });

  const required = buildObjectSubsetSchema(kwargsSchema, requiredProperties, requiredPropertyNames);
  const optional = buildObjectSubsetSchema(kwargsSchema, optionalProperties);

  return {
    required,
    optional,
    requiredUi: pickUiSchemaFields(uiKwargs, requiredPropertyNames),
    optionalUi: pickUiSchemaFields(uiKwargs, Object.keys(optionalProperties)),
  };
};

export type SplitJobFunctionSchemaResult = {
  requiredSchema: JsonSchemaRecord | null;
  optionalSchema: JsonSchemaRecord | null;
  requiredUiSchema: UiSchemaRecord | undefined;
  optionalUiSchema: UiSchemaRecord | undefined;
  hasOptionalJsonFields: boolean;
};

export const hasJsonSchemaProperties = (schema: JsonSchemaRecord | null | undefined): boolean => {
  if (!schema) {
    return false;
  }

  const properties = schema.properties;
  return isRecord(properties) && Object.keys(properties).length > 0;
};

export const mergeJobFunctionSchemas = (
  requiredSchema: JsonSchemaRecord | null,
  optionalSchema: JsonSchemaRecord | null
): JsonSchemaRecord | null => {
  if (!requiredSchema && !optionalSchema) {
    return null;
  }

  if (!requiredSchema) {
    return optionalSchema;
  }

  if (!optionalSchema) {
    return requiredSchema;
  }

  const requiredProperties = (requiredSchema.properties ?? {}) as JsonSchemaRecord;
  const optionalProperties = (optionalSchema.properties ?? {}) as JsonSchemaRecord;
  const mergedProperties: JsonSchemaRecord = { ...requiredProperties };

  Object.entries(optionalProperties).forEach(([propertyName, optionalPropertySchema]) => {
    const existingPropertySchema = mergedProperties[propertyName];
    if (
      propertyName === "kwargs" &&
      isRecord(existingPropertySchema) &&
      isRecord(optionalPropertySchema)
    ) {
      const existingKwargsProperties = (existingPropertySchema.properties ??
        {}) as JsonSchemaRecord;
      const optionalKwargsProperties = (optionalPropertySchema.properties ??
        {}) as JsonSchemaRecord;
      const mergedKwargsRequired = [
        ...getRequiredPropertyNames(existingPropertySchema),
        ...getRequiredPropertyNames(optionalPropertySchema),
      ];

      mergedProperties[propertyName] = {
        ...existingPropertySchema,
        ...optionalPropertySchema,
        properties: {
          ...existingKwargsProperties,
          ...optionalKwargsProperties,
        },
        ...(mergedKwargsRequired.length > 0 ? { required: mergedKwargsRequired } : {}),
      };
      return;
    }

    mergedProperties[propertyName] = optionalPropertySchema;
  });

  const mergedRequired = [
    ...getRequiredPropertyNames(requiredSchema),
    ...getRequiredPropertyNames(optionalSchema),
  ];

  return buildObjectSubsetSchema(
    { ...requiredSchema, ...optionalSchema },
    mergedProperties,
    mergedRequired
  );
};

export const mergeJobFunctionUiSchemas = (
  requiredUiSchema: UiSchemaRecord | undefined,
  optionalUiSchema: UiSchemaRecord | undefined
): UiSchemaRecord | undefined => {
  if (!requiredUiSchema && !optionalUiSchema) {
    return undefined;
  }

  if (!requiredUiSchema) {
    return optionalUiSchema;
  }

  if (!optionalUiSchema) {
    return requiredUiSchema;
  }

  const merged: UiSchemaRecord = { ...requiredUiSchema };

  Object.entries(optionalUiSchema).forEach(([propertyName, optionalUiProperty]) => {
    const existingUiProperty = merged[propertyName];
    if (propertyName === "kwargs" && isRecord(existingUiProperty) && isRecord(optionalUiProperty)) {
      merged[propertyName] = {
        ...existingUiProperty,
        ...optionalUiProperty,
      };
      return;
    }

    merged[propertyName] = optionalUiProperty;
  });

  return merged;
};

export const splitJobFunctionSchema = (
  jsonSchema: JsonSchemaRecord | null | undefined,
  uiSchema?: UiSchemaRecord | null
): SplitJobFunctionSchemaResult => {
  if (!jsonSchema || !isRecord(jsonSchema.properties)) {
    return {
      requiredSchema: null,
      optionalSchema: null,
      requiredUiSchema: undefined,
      optionalUiSchema: undefined,
      hasOptionalJsonFields: false,
    };
  }

  const rootProperties = jsonSchema.properties;
  const requiredProperties: JsonSchemaRecord = {};
  const optionalProperties: JsonSchemaRecord = {};
  const requiredUiSchema: UiSchemaRecord = {};
  const optionalUiSchema: UiSchemaRecord = {};

  Object.entries(rootProperties).forEach(([propertyName, propertySchema]) => {
    if (!isRecord(propertySchema)) {
      return;
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
      return;
    }

    if (isTopLevelPropertyRequired(propertyName, jsonSchema)) {
      requiredProperties[propertyName] = propertySchema;
      if (propertyUi) {
        requiredUiSchema[propertyName] = propertyUi;
      }
      return;
    }

    optionalProperties[propertyName] = propertySchema;
    if (propertyUi) {
      optionalUiSchema[propertyName] = propertyUi;
    }
  });

  const requiredSchema = buildObjectSubsetSchema(
    jsonSchema,
    requiredProperties,
    getRequiredPropertyNames(jsonSchema)
  );
  const optionalSchema = buildObjectSubsetSchema(jsonSchema, optionalProperties);

  return {
    requiredSchema,
    optionalSchema,
    requiredUiSchema: Object.keys(requiredUiSchema).length > 0 ? requiredUiSchema : undefined,
    optionalUiSchema: Object.keys(optionalUiSchema).length > 0 ? optionalUiSchema : undefined,
    hasOptionalJsonFields: hasJsonSchemaProperties(optionalSchema),
  };
};

export const getJobParamsDisplaySchema = (
  jsonSchema: JsonSchemaRecord | null | undefined,
  uiSchema: UiSchemaRecord | null | undefined,
  isAdvancedSettingsEnabled: boolean
): { schema: JsonSchemaRecord | null; uiSchema: UiSchemaRecord | undefined } => {
  if (!jsonSchema) {
    return { schema: null, uiSchema: undefined };
  }

  if (isAdvancedSettingsEnabled) {
    return {
      schema: jsonSchema,
      uiSchema: uiSchema ?? undefined,
    };
  }

  const { requiredSchema, requiredUiSchema } = splitJobFunctionSchema(jsonSchema, uiSchema);
  return {
    schema: requiredSchema,
    uiSchema: requiredUiSchema,
  };
};
