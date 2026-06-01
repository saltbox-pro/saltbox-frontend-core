export type JsonSchemaRecord = Record<string, unknown>;
export type UiSchemaRecord = Record<string, unknown>;

export type JobParamsSchemaLayout = {
  displaySchema: JsonSchemaRecord | null;
  displayUiSchema: UiSchemaRecord | undefined;
  optionalTopLevelPropertyNames: string[];
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
): {
  requiredSchema: JsonSchemaRecord | null;
  optionalSchema: JsonSchemaRecord | null;
  requiredUiSchema: UiSchemaRecord | undefined;
  optionalUiSchema: UiSchemaRecord | undefined;
} => {
  const rootProperties = jsonSchema.properties as JsonSchemaRecord;
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

const getOptionalTopLevelPropertyNamesFromSplit = (optionalSchema: JsonSchemaRecord | null) => {
  const properties = optionalSchema?.properties;
  if (!isRecord(properties)) {
    return [];
  }
  return Object.keys(properties);
};

export const hasJsonSchemaProperties = (schema: JsonSchemaRecord | null | undefined): boolean => {
  if (!schema) {
    return false;
  }

  const properties = schema.properties;
  return isRecord(properties) && Object.keys(properties).length > 0;
};

export const getJobParamsSchemaLayout = (
  jsonSchema: JsonSchemaRecord | null | undefined,
  uiSchema: UiSchemaRecord | null | undefined,
  isAdvancedSettingsEnabled: boolean
): JobParamsSchemaLayout => {
  if (!jsonSchema || !isRecord(jsonSchema.properties)) {
    return {
      displaySchema: null,
      displayUiSchema: undefined,
      optionalTopLevelPropertyNames: [],
    };
  }

  if (isAdvancedSettingsEnabled) {
    return {
      displaySchema: jsonSchema,
      displayUiSchema: uiSchema ?? undefined,
      optionalTopLevelPropertyNames: [],
    };
  }

  const split = splitJobFunctionSchema(jsonSchema, uiSchema);

  return {
    displaySchema: split.requiredSchema,
    displayUiSchema: split.requiredUiSchema,
    optionalTopLevelPropertyNames: getOptionalTopLevelPropertyNamesFromSplit(split.optionalSchema),
  };
};

export const isValidationErrorInOptionalSections = (
  errors: { property?: string }[],
  optionalTopLevelPropertyNames: string[]
): boolean => {
  if (optionalTopLevelPropertyNames.length === 0 || errors.length === 0) {
    return false;
  }

  return errors.some((error) => {
    const propertyPath = (error.property ?? "").trim();
    if (!propertyPath) {
      return false;
    }

    const normalizedPath = propertyPath.startsWith(".") ? propertyPath : `.${propertyPath}`;

    return optionalTopLevelPropertyNames.some((propertyName) => {
      const rootPrefix = `.${propertyName}`;
      return (
        normalizedPath === rootPrefix ||
        normalizedPath.startsWith(`${rootPrefix}.`) ||
        normalizedPath.startsWith(`${rootPrefix}[`)
      );
    });
  });
};
