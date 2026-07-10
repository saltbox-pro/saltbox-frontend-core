import { getApiErrorMessage } from "@saltbox/saltbox-frontend-common";

import { BgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";

export type SyncErrorKind = "failed" | "error";

export const resolveSyncErrorKind = (reason: unknown): SyncErrorKind => {
  if (reason instanceof BgTaskFailedError) {
    return "failed";
  }

  return "error";
};

export async function getSyncErrorDetail(reason: unknown): Promise<string | null> {
  if (reason instanceof BgTaskFailedError && reason.message !== "BG_TASK_FAILED") {
    return reason.message;
  }

  const message = await getApiErrorMessage(reason, "");
  return message || null;
}
