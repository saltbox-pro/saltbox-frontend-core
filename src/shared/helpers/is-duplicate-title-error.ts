import type { AppError } from "@saltbox/saltbox-frontend-common";

export function isDuplicateTitleError(error: AppError): boolean {
  return (
    error.status === 409 ||
    ((error.status === 400 || error.status === 422) &&
      Boolean(error.serverMessage?.includes("Duplicate key")))
  );
}
