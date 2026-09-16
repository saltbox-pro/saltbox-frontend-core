import type { AppError } from "@saltbox/saltbox-frontend-common";

const DUPLICATE_NAME_MESSAGE_PATTERN =
  /already exists|duplicate|unique(?:\s+\w+)*\s+constraint|must be unique|уже существует|неуникал/i;

/** 409 — дубликат всегда; 400/422 — только если об этом говорит сообщение бэкенда. */
export function isSourceDuplicateNameError(error: AppError): boolean {
  if (error.status === 409) {
    return true;
  }

  if (error.status === 400 || error.status === 422) {
    return DUPLICATE_NAME_MESSAGE_PATTERN.test(error.serverMessage ?? "");
  }

  return false;
}
