import type { ErrorSchema, RJSFSchema } from "@rjsf/utils";
import { rjsfValidator } from "@saltbox/saltbox-frontend-common";

export type JsonSchemaRecord = Record<string, unknown>;
export type UiSchemaRecord = Record<string, unknown>;

export type JobParamsSchemaLayout = {
  displaySchema: JsonSchemaRecord | null;
  displayUiSchema: UiSchemaRecord | undefined;
};

type SplitSchemaResult = {
  requiredSchema: JsonSchemaRecord | null;
  optionalSchema: JsonSchemaRecord | null;
};

const COMBINATOR_KEYWORDS = ["$ref", "oneOf", "anyOf", "allOf", "enum", "const"] as const;

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

const getNamedProperties = (schema: JsonSchemaRecord): JsonSchemaRecord | null => {
  const properties = schema.properties;
  return isJsonSchemaRecord(properties) && Object.keys(properties).length > 0 ? properties : null;
};

const isSplittableObjectSchema = (schema: JsonSchemaRecord): boolean =>
  getNamedProperties(schema) !== null &&
  COMBINATOR_KEYWORDS.every((keyword) => schema[keyword] === undefined);

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

  const baseProperties = getNamedProperties(baseSchema) ?? {};
  const hasOmittedProperties =
    Object.keys(baseProperties).length !== Object.keys(properties).length;

  if (hasOmittedProperties && subset.additionalProperties === false) {
    delete subset.additionalProperties;
  }

  return subset;
};

const splitSchemaByRequired = (schema: JsonSchemaRecord, isRoot = false): SplitSchemaResult => {
  const properties = getNamedProperties(schema) ?? {};
  const ownRequiredNames = new Set(getRequiredPropertyNames(schema));
  const requiredProperties: JsonSchemaRecord = {};
  const optionalProperties: JsonSchemaRecord = {};
  const requiredNames: string[] = [];

  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    if (!isJsonSchemaRecord(propertySchema)) {
      continue;
    }

    const isRequiredHere =
      ownRequiredNames.has(propertyName) ||
      (isRoot && propertyName === "args" && isArrayFieldRequired(propertySchema));

    if (isRequiredHere) {
      requiredProperties[propertyName] = propertySchema;
      requiredNames.push(propertyName);
      continue;
    }

    if (isSplittableObjectSchema(propertySchema)) {
      const childSplit = splitSchemaByRequired(propertySchema);

      if (childSplit.requiredSchema) {
        requiredProperties[propertyName] = childSplit.requiredSchema;
        requiredNames.push(propertyName);
      }
      if (childSplit.optionalSchema) {
        optionalProperties[propertyName] = childSplit.optionalSchema;
      }
      continue;
    }

    if (getRequiredPropertyNames(propertySchema).length > 0) {
      requiredProperties[propertyName] = propertySchema;
      requiredNames.push(propertyName);
      continue;
    }

    optionalProperties[propertyName] = propertySchema;
  }

  return {
    requiredSchema: buildObjectSubsetSchema(schema, requiredProperties, requiredNames),
    optionalSchema: buildObjectSubsetSchema(schema, optionalProperties),
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
    if (isJsonSchemaRecord(jsonSchema)) {
      return {
        displaySchema: jsonSchema,
        displayUiSchema: uiSchema ?? undefined,
      };
    }

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

  const split = splitSchemaByRequired(jsonSchema, true);

  return {
    displaySchema: split.requiredSchema,
    displayUiSchema: uiSchema ?? undefined,
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

  const split = splitSchemaByRequired(jsonSchema, true);

  return {
    displaySchema: omitRootProperties(split.optionalSchema, POSITIONAL_ARGS_PROPERTY_NAMES),
    displayUiSchema: uiSchema ?? undefined,
  };
};

const allowExtraFormDataInSubsetSchema = (schema: JsonSchemaRecord): JsonSchemaRecord => {
  const properties = schema.properties;
  const additionalProperties = isJsonSchemaRecord(schema.additionalProperties)
    ? schema.additionalProperties
    : true;

  if (!isJsonSchemaRecord(properties)) {
    return { ...schema, additionalProperties };
  }

  return {
    ...schema,
    additionalProperties,
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

const isValidationPathHidden = (schema: JsonSchemaRecord, segments: string[]): boolean => {
  let current = schema;

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      const items = current.items;
      if (!isJsonSchemaRecord(items)) {
        return false;
      }
      current = items;
      continue;
    }

    const properties = getNamedProperties(current);
    const child = properties?.[segment];

    if (isJsonSchemaRecord(child)) {
      current = child;
      continue;
    }

    const additionalProperties = current.additionalProperties;
    if (isJsonSchemaRecord(additionalProperties)) {
      current = additionalProperties;
      continue;
    }

    return properties !== null && additionalProperties !== true;
  }

  return false;
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
    return segments.length > 0 && isValidationPathHidden(displaySchema, segments);
  });
};

const validateFormDataWithSchema = (
  formData: Record<string, unknown>,
  schema: JsonSchemaRecord,
  uiSchema?: UiSchemaRecord
) =>
  rjsfValidator.validateFormData(
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
    if (isAdvancedSettingsEnabled || !jsonSchema || !hasJsonSchemaProperties(jsonSchema)) {
      return { ok: true };
    }

    const { errors } = validateFormDataWithSchema(formData, jsonSchema, uiSchema);

    return errors.length > 0 ? { ok: false, openAdvanced: true } : { ok: true };
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
