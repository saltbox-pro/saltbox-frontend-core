export const MANUAL_SALT_FUNCTION_PATTERN = /^[_0-9a-z]+\.[_0-9a-z]+$/i;

export const normalizeManualSaltFunctionName = (value: string): string => value.trim();

export const areSameManualSaltFunctionName = (left: string, right: string): boolean =>
  normalizeManualSaltFunctionName(left).toLowerCase() ===
  normalizeManualSaltFunctionName(right).toLowerCase();

export const isValidManualSaltFunctionName = (value: string): boolean =>
  MANUAL_SALT_FUNCTION_PATTERN.test(value);
