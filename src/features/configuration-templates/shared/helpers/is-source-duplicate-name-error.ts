import { getApiErrorMessage } from "@saltbox/saltbox-frontend-common";

const DUPLICATE_NAME_MESSAGE_PATTERN =
  /already exists|duplicate|unique(?:\s+\w+)*\s+constraint|must be unique|уже существует|неуникал/i;

function isResponseError(error: unknown): error is { name: string; response: Response } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "ResponseError" &&
    "response" in error
  );
}

export async function isSourceDuplicateNameError(error: unknown): Promise<boolean> {
  if (!isResponseError(error)) {
    return false;
  }

  const { status } = error.response;
  if (status === 409) {
    return true;
  }

  if (status === 400 || status === 422) {
    const message = await getApiErrorMessage(error, "");
    return DUPLICATE_NAME_MESSAGE_PATTERN.test(message);
  }

  return false;
}
