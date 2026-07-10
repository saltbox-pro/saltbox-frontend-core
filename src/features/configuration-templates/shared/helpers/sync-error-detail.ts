import { getApiErrorMessage } from "@saltbox/saltbox-frontend-common";

import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";
import { getBgTaskErrorMessage } from "saltbox-core/shared/helpers/get-bg-task-error-message";

export type SyncErrorKind = "failed" | "error";

export const resolveSyncErrorKind = (reason: unknown): SyncErrorKind => {
  if (isBgTaskFailedError(reason)) {
    return "failed";
  }

  return "error";
};

export async function getSyncErrorDetail(reason: unknown): Promise<string | null> {
  const bgTaskMessage = getBgTaskErrorMessage(reason, "");
  if (bgTaskMessage) {
    return bgTaskMessage;
  }

  const message = await getApiErrorMessage(reason, "");
  return message || null;
}
