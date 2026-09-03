import { getDefaultFormState } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS } from "@saltbox/saltbox-frontend-common";
import type { KeyboardEvent } from "react";

export type TtlUnit = "seconds" | "minutes" | "hours";

export type TtlParts = {
  value: number | null;
  unit: TtlUnit;
};

export {
  areSameManualSaltFunctionName,
  isValidManualSaltFunctionName,
  MANUAL_SALT_FUNCTION_PATTERN,
  normalizeManualSaltFunctionName,
} from "./salt-function-name";

export const cleanNullsFromKwargs = (kwargs?: Record<string, unknown>): Record<string, unknown> => {
  if (!kwargs) {
    return {};
  }

  const cleaned: Record<string, unknown> = {};
  Object.entries(kwargs).forEach(([key, value]) => {
    if (value !== null) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

interface GetArgAndKwargForRequestParams {
  jsonFormValue?: Record<string, unknown>;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeArgList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value != null) {
    return [value];
  }
  return [];
};

const toRequestArg = (value: unknown): unknown[] | undefined => {
  const normalized = normalizeArgList(value);
  return normalized.length > 0 ? normalized : undefined;
};

const toRequestKwarg = (value: unknown): Record<string, unknown> | undefined => {
  if (!isPlainObject(value)) {
    return undefined;
  }
  const cleaned = cleanNullsFromKwargs(value);
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

const hasNonEmptyFormArgs = (jsonFormValue?: Record<string, unknown>): boolean =>
  toRequestArg(jsonFormValue?.args) != null || toRequestArg(jsonFormValue?.arg) != null;

const hasNonEmptyFormKwargs = (jsonFormValue?: Record<string, unknown>): boolean =>
  toRequestKwarg(jsonFormValue?.kwargs) != null || toRequestKwarg(jsonFormValue?.kwarg) != null;

const getSchemaRootProperties = (jsonSchema: unknown): Record<string, unknown> => {
  if (!isPlainObject(jsonSchema) || !isPlainObject(jsonSchema.properties)) {
    return {};
  }
  return jsonSchema.properties;
};

const resolveSchemaPropertyKey = (
  properties: Record<string, unknown>,
  preferredKeys: string[]
): string | undefined => preferredKeys.find((key) => key in properties);

const COMBINATOR_KEYWORDS = ["$ref", "oneOf", "anyOf", "allOf", "enum", "const"] as const;

const matchesAnyPattern = (patterns: string[], key: string): boolean =>
  patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(key);
    } catch {
      // Паттерн не компилируется — считаем ключ подходящим, чтобы не терять данные.
      return true;
    }
  });

export const pruneKwargsBySchema = (
  kwargs: Record<string, unknown>,
  jsonSchema?: unknown
): Record<string, unknown> => {
  const rootProperties = getSchemaRootProperties(jsonSchema);
  const kwargsKey = resolveSchemaPropertyKey(rootProperties, ["kwargs", "kwarg"]);
  const kwargsSchema = kwargsKey ? rootProperties[kwargsKey] : undefined;

  if (!isPlainObject(kwargsSchema) || kwargsSchema.additionalProperties !== false) {
    return kwargs;
  }

  if (COMBINATOR_KEYWORDS.some((keyword) => kwargsSchema[keyword] !== undefined)) {
    return kwargs;
  }

  const allowedProperties = isPlainObject(kwargsSchema.properties) ? kwargsSchema.properties : {};
  const allowedPatterns = isPlainObject(kwargsSchema.patternProperties)
    ? Object.keys(kwargsSchema.patternProperties)
    : [];

  return Object.fromEntries(
    Object.entries(kwargs).filter(
      ([key]) => key in allowedProperties || matchesAnyPattern(allowedPatterns, key)
    )
  );
};

export const getArgAndKwargForRequest = ({
  jsonFormValue,
  arg,
  kwarg,
}: GetArgAndKwargForRequestParams): {
  arg: unknown[] | undefined;
  kwarg: Record<string, unknown> | undefined;
} => {
  const useBaselineFromProps =
    !hasNonEmptyFormArgs(jsonFormValue) && !hasNonEmptyFormKwargs(jsonFormValue);

  return {
    arg:
      toRequestArg(jsonFormValue?.args) ??
      toRequestArg(jsonFormValue?.arg) ??
      (useBaselineFromProps ? toRequestArg(arg) : undefined),
    kwarg:
      toRequestKwarg(jsonFormValue?.kwargs) ??
      toRequestKwarg(jsonFormValue?.kwarg) ??
      (useBaselineFromProps ? toRequestKwarg(kwarg) : undefined),
  };
};

export const getDefaultJsonFormValue = (jsonSchema: unknown): Record<string, unknown> => {
  if (
    !jsonSchema ||
    typeof jsonSchema !== "object" ||
    Array.isArray(jsonSchema) ||
    Object.keys(jsonSchema).length === 0
  ) {
    return {};
  }

  try {
    const defaults = getDefaultFormState(
      validator,
      jsonSchema as never,
      undefined,
      jsonSchema as never,
      undefined,
      JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS
    );

    return defaults && typeof defaults === "object" && !Array.isArray(defaults)
      ? (defaults as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const mergeDefaultsWithValues = (
  defaults: Record<string, unknown>,
  values: Record<string, unknown>
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...defaults };

  Object.entries(values).forEach(([key, value]) => {
    const defaultValue = merged[key];
    merged[key] =
      isPlainObject(defaultValue) && isPlainObject(value)
        ? mergeDefaultsWithValues(defaultValue, value)
        : value;
  });

  return merged;
};

export const getRepeatJsonFormValue = (
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined,
  jsonSchema?: unknown
): Record<string, unknown> => {
  const properties = getSchemaRootProperties(jsonSchema);
  const cleanedKwargs = pruneKwargsBySchema(cleanNullsFromKwargs(kwarg), jsonSchema);
  const normalizedArgs = normalizeArgList(arg);
  const hasArgsValue = normalizedArgs.length > 0;
  const hasKwargsValue = Object.keys(cleanedKwargs).length > 0;

  if (Object.keys(properties).length === 0) {
    const fallback: Record<string, unknown> = {};
    if (hasArgsValue) {
      fallback.args = normalizedArgs;
    }
    if (hasKwargsValue) {
      fallback.kwargs = cleanedKwargs;
    }
    return fallback;
  }

  const result: Record<string, unknown> = { ...getDefaultJsonFormValue(jsonSchema) };
  const argsKey = resolveSchemaPropertyKey(properties, ["args", "arg"]);
  const kwargsKey = resolveSchemaPropertyKey(properties, ["kwargs", "kwarg"]);

  if (!argsKey) {
    delete result.args;
    delete result.arg;
  } else if (hasArgsValue) {
    result[argsKey] = normalizedArgs;
  }

  if (!kwargsKey) {
    delete result.kwargs;
    delete result.kwarg;
  } else if (hasKwargsValue) {
    const existingKwargs = isPlainObject(result[kwargsKey])
      ? (result[kwargsKey] as Record<string, unknown>)
      : {};
    result[kwargsKey] = mergeDefaultsWithValues(existingKwargs, cleanedKwargs);
  }

  return result;
};

export const hasBaselineJobArgs = (
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined
): boolean =>
  (Array.isArray(arg) && arg.length > 0) || (kwarg != null && Object.keys(kwarg).length > 0);

export const parseTtlValue = (rawValue: unknown): number | null => {
  if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue >= 0) {
    return rawValue;
  }
  if (typeof rawValue === "string" && rawValue.trim() !== "") {
    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }
  return null;
};

export const totalSecondsToTtlParts = (totalSeconds: number): TtlParts => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return { value: null, unit: "seconds" };
  }
  const secondsRounded = Math.floor(totalSeconds);
  if (secondsRounded >= 3600 && secondsRounded % 3600 === 0) {
    return { value: secondsRounded / 3600, unit: "hours" };
  }
  if (secondsRounded >= 60 && secondsRounded % 60 === 0) {
    return { value: secondsRounded / 60, unit: "minutes" };
  }
  return { value: secondsRounded, unit: "seconds" };
};

export const ttlPartsToTotalSeconds = (
  ttlValue: number | null,
  ttlUnit: TtlUnit
): number | undefined => {
  if (ttlValue == null || !Number.isFinite(ttlValue) || ttlValue < 0) {
    return undefined;
  }
  if (ttlUnit === "minutes") {
    return Math.round(ttlValue * 60);
  }
  if (ttlUnit === "hours") {
    return Math.round(ttlValue * 3600);
  }
  return Math.round(ttlValue);
};

export const isTimeoutInputKeyAllowed = (event: KeyboardEvent<HTMLInputElement>): boolean => {
  const key = event.key;
  const isCtrlOrMetaCombo =
    event.ctrlKey || event.metaKey ? ["a", "c", "v", "x"].includes(key.toLowerCase()) : false;
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];

  if (isCtrlOrMetaCombo || allowedKeys.includes(key)) {
    return true;
  }

  return /^\d$/.test(key);
};

export const isTimeoutPasteAllowed = (pasted: string): boolean => {
  return /^\d+$/.test(pasted);
};
