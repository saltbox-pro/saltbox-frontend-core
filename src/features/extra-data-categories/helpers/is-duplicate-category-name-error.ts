import type { AppError } from "@saltbox/saltbox-frontend-common";

const DUPLICATE_KEY_MESSAGE = "Duplicate key";

export function isDuplicateCategoryNameError(error: AppError): boolean {
  if (error.status === 409) return true;

  return (
    (error.status === 400 || error.status === 422) &&
    Boolean(error.serverMessage?.includes(DUPLICATE_KEY_MESSAGE))
  );
}
