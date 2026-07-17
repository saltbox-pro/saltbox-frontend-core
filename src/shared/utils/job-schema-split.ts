import type { ErrorSchema, RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

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

export const isJsonSchemaRecord = (value: unknown): value is JsonSchemaRecord =>
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
    (propertyName === "args" &&
      isJsonSchemaRecord(propertySchema) &&
      isArrayFieldRequired(propertySchema))
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

const getRootRequiredForSubsetSchema = (
  jsonSchema: JsonSchemaRecord,
  requiredProperties: JsonSchemaRecord
): string[] => {
  const rootRequired = new Set(getRequiredPropertyNames(jsonSchema));
  const kwargsSchema = requiredProperties.kwargs;

  if (isJsonSchemaRecord(kwargsSchema) && getRequiredPropertyNames(kwargsSchema).length > 0) {
    rootRequired.add("kwargs");
  }

  return [...rootRequired];
};

const splitKwargsSchema = (
  kwargsSchema: JsonSchemaRecord,
  uiKwargs?: UiSchemaRecord
): SplitKwargsSchemaResult => {
  const properties = kwargsSchema.properties;
  const hasNamedProperties = isJsonSchemaRecord(properties) && Object.keys(properties).length > 0;

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
    if (!isJsonSchemaRecord(propertySchema)) {
      continue;
    }

    const propertyUiSchema = uiSchema?.[propertyName];
    const propertyUi = isJsonSchemaRecord(propertyUiSchema) ? propertyUiSchema : undefined;

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
      getRootRequiredForSubsetSchema(jsonSchema, requiredProperties)
    ),
    optionalSchema: buildObjectSubsetSchema(jsonSchema, optionalProperties),
    requiredUiSchema: Object.keys(requiredUiSchema).length > 0 ? requiredUiSchema : undefined,
    optionalUiSchema: Object.keys(optionalUiSchema).length > 0 ? optionalUiSchema : undefined,
  };
};

export const hasJsonSchemaProperties = (schema: JsonSchemaRecord | null | undefined): boolean => {
  return (
    !!schema && isJsonSchemaRecord(schema.properties) && Object.keys(schema.properties).length > 0
  );
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

const POSITIONAL_ARGS_PROPERTY_NAMES = ["args", "arg"];

const omitRootProperties = (
  schema: JsonSchemaRecord | null,
  propertyNames: string[]
): JsonSchemaRecord | null => {
  if (!schema || !isJsonSchemaRecord(schema.properties)) {
    return schema;
  }

  const properties = Object.fromEntries(
    Object.entries(schema.properties).filter(([name]) => !propertyNames.includes(name))
  );
  const required = getRequiredPropertyNames(schema).filter((name) => !propertyNames.includes(name));

  return buildObjectSubsetSchema(schema, properties, required);
};

export const getOptionalJobParamsSchemaLayout = (
  jsonSchema: JsonSchemaRecord | null | undefined,
  uiSchema: UiSchemaRecord | null | undefined
): JobParamsSchemaLayout => {
  if (!hasJsonSchemaProperties(jsonSchema)) {
    return {
      displaySchema: null,
      displayUiSchema: undefined,
    };
  }

  const split = splitJobFunctionSchema(jsonSchema, uiSchema);

  return {
    displaySchema: omitRootProperties(split.optionalSchema, POSITIONAL_ARGS_PROPERTY_NAMES),
    displayUiSchema: split.optionalUiSchema,
  };
};

const allowExtraFormDataInSubsetSchema = (schema: JsonSchemaRecord): JsonSchemaRecord => {
  const properties = schema.properties;
  if (!isJsonSchemaRecord(properties)) {
    return { ...schema, additionalProperties: true };
  }

  return {
    ...schema,
    additionalProperties: true,
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, propertySchema]) => {
        if (
          !isJsonSchemaRecord(propertySchema) ||
          (propertySchema.type !== "object" &&
            !isJsonSchemaRecord(propertySchema.properties) &&
            propertySchema.additionalProperties === undefined)
        ) {
          return [name, propertySchema];
        }
        return [name, allowExtraFormDataInSubsetSchema(propertySchema)];
      })
    ),
  };
};

const getValidationPathSegments = (propertyPath: string): string[] => {
  const trimmed = propertyPath.trim();
  if (!trimmed) {
    return [];
  }
  const normalized = trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
  return normalized
    .slice(1)
    .split(/\.|\[|\]/)
    .filter((segment) => segment !== "");
};

const resolveSchemaAtPath = (
  schema: JsonSchemaRecord,
  segments: string[]
): JsonSchemaRecord | null => {
  let current: JsonSchemaRecord | null = schema;

  for (const segment of segments) {
    if (!current) {
      return null;
    }
    if (/^\d+$/.test(segment)) {
      const items = current.items;
      current = isJsonSchemaRecord(items) && !Array.isArray(items) ? items : null;
      continue;
    }
    const properties = current.properties;
    if (!isJsonSchemaRecord(properties) || !(segment in properties)) {
      return null;
    }
    const child = properties[segment];
    current = isJsonSchemaRecord(child) ? child : null;
  }

  return current;
};

const hasHiddenValidationErrors = (
  errors: { property?: string }[],
  displaySchema: JsonSchemaRecord | null | undefined
): boolean => {
  if (!displaySchema) {
    return false;
  }
  return errors.some((error) => {
    const segments = getValidationPathSegments(error.property ?? "");
    return segments.length > 0 && resolveSchemaAtPath(displaySchema, segments) === null;
  });
};

const validateFormDataWithSchema = (
  formData: Record<string, unknown>,
  schema: JsonSchemaRecord,
  uiSchema?: UiSchemaRecord
) =>
  validator.validateFormData(
    formData,
    schema as RJSFSchema,
    undefined,
    undefined,
    uiSchema as UiSchemaRecord
  );

export type JobJsonFormValidationResult =
  | { ok: true }
  | { ok: false; openAdvanced: true }
  | { ok: false; useFormRef: true }
  | { ok: false; errorSchema: ErrorSchema };

export const validateJobJsonFormData = (
  formData: Record<string, unknown>,
  jsonSchema: JsonSchemaRecord | undefined,
  uiSchema: UiSchemaRecord | undefined,
  isAdvancedSettingsEnabled: boolean,
  displaySchema: JsonSchemaRecord | null | undefined,
  displayUiSchema: UiSchemaRecord | undefined
): JobJsonFormValidationResult => {
  if (!hasJsonSchemaProperties(displaySchema)) {
    return { ok: true };
  }

  if (jsonSchema && hasJsonSchemaProperties(jsonSchema)) {
    const { errors: fullErrors } = validateFormDataWithSchema(formData, jsonSchema, uiSchema);
    if (
      fullErrors.length > 0 &&
      !isAdvancedSettingsEnabled &&
      hasHiddenValidationErrors(fullErrors, displaySchema)
    ) {
      return { ok: false, openAdvanced: true };
    }
  }

  if (isAdvancedSettingsEnabled) {
    return { ok: false, useFormRef: true };
  }

  const validationSchema = displaySchema ? allowExtraFormDataInSubsetSchema(displaySchema) : null;
  if (!validationSchema) {
    return { ok: true };
  }

  const { errors, errorSchema } = validateFormDataWithSchema(
    formData,
    validationSchema,
    displayUiSchema
  );

  if (errors.length > 0) {
    return { ok: false, errorSchema };
  }

  return { ok: true };
};
