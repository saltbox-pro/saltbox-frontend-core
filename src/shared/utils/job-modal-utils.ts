import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import type { KeyboardEvent } from "react";

import {
  hasJsonSchemaProperties,
  isValidationErrorInOptionalSections,
  type JsonSchemaRecord,
  type UiSchemaRecord,
} from "./job-schema-split";

export type TtlUnit = "seconds" | "minutes" | "hours";

export type TtlParts = {
  value: number | null;
  unit: TtlUnit;
};

export const MANUAL_SALT_FUNCTION_PATTERN = /^[_0-9a-z]+\.[_0-9a-z]+$/i;

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

export const getArgAndKwargForRequest = ({
  jsonFormValue,
  arg,
  kwarg,
}: GetArgAndKwargForRequestParams): {
  arg: unknown[] | undefined;
  kwarg: Record<string, unknown> | undefined;
} => {
  const useBaselineFromProps =
    !jsonFormValue?.args && !jsonFormValue?.arg && !jsonFormValue?.kwargs && !jsonFormValue?.kwarg;

  return {
    arg:
      (jsonFormValue?.args as unknown[] | undefined) ??
      (jsonFormValue?.arg as unknown[] | undefined) ??
      (useBaselineFromProps ? arg : undefined),
    kwarg:
      (jsonFormValue?.kwargs as Record<string, unknown> | undefined) ??
      (jsonFormValue?.kwarg as Record<string, unknown> | undefined) ??
      (useBaselineFromProps ? cleanNullsFromKwargs(kwarg) : undefined),
  };
};

export const isValidManualSaltFunctionName = (value: string): boolean => {
  return MANUAL_SALT_FUNCTION_PATTERN.test(value);
};

export const getRepeatJsonFormValue = (
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined
) => ({
  args: Array.isArray(arg) ? arg : arg != null ? [arg] : [],
  kwargs: cleanNullsFromKwargs(kwarg),
});

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

export type JobJsonFormValidationOutcome =
  | { status: "valid" }
  | { status: "invalid"; shouldOpenAdvancedSettings: boolean };

export const resolveJobJsonFormValidation = (
  formData: Record<string, unknown>,
  jsonSchema: JsonSchemaRecord | undefined,
  uiSchema: UiSchemaRecord | undefined,
  isAdvancedSettingsEnabled: boolean,
  optionalTopLevelPropertyNames: string[]
): JobJsonFormValidationOutcome => {
  if (!jsonSchema || !hasJsonSchemaProperties(jsonSchema)) {
    return { status: "valid" };
  }

  const { errors } = validator.validateFormData(
    formData,
    jsonSchema as RJSFSchema,
    undefined,
    undefined,
    uiSchema as UiSchemaRecord
  );

  if (errors.length === 0) {
    return { status: "valid" };
  }

  if (isAdvancedSettingsEnabled) {
    return { status: "invalid", shouldOpenAdvancedSettings: false };
  }

  return {
    status: "invalid",
    shouldOpenAdvancedSettings: isValidationErrorInOptionalSections(
      errors,
      optionalTopLevelPropertyNames
    ),
  };
};

export const fetchJobFunctionSchema = async (
  functionName: string,
  getSchema: (name: string) => Promise<JobSchemaModel | null | undefined>
): Promise<JobSchemaModel> => {
  const primary = await getSchema(functionName);
  if (primary) {
    return primary;
  }
  if (functionName === "default") {
    throw new Error("JOB_SCHEMA_LOAD_FAILED");
  }
  const fallback = await getSchema("default");
  if (fallback) {
    return fallback;
  }
  throw new Error("JOB_SCHEMA_LOAD_FAILED");
};
