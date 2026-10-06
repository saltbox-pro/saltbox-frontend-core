import type { AppError } from "@saltbox/saltbox-frontend-common";

import { isBgTaskFailedError } from "saltbox-core/shared/errors/bg-task-failed.error";

export type ContentUpdateFailureReason = "conflict" | "locked";

export type ContentUpdateFailure = {
  phase: "check" | "apply";
  error: AppError;
  reason: ContentUpdateFailureReason | null;
};

const REASON_BY_EXC_TYPE: Record<string, ContentUpdateFailureReason> = {
  SourceUpdateConflictException: "conflict",
  TaskTemplateSourceLockException: "locked",
};

const REASON_MESSAGE_KEYS: Record<ContentUpdateFailureReason, string> = {
  conflict: "configuration-templates.source-update.error-conflict",
  locked: "configuration-templates.source-update.error-locked",
};

export function resolveContentUpdateFailure(
  phase: ContentUpdateFailure["phase"],
  error: AppError
): ContentUpdateFailure {
  const excType = isBgTaskFailedError(error.raw) ? error.raw.excType : undefined;

  return {
    phase,
    error,
    reason: (excType && REASON_BY_EXC_TYPE[excType]) || null,
  };
}

export function getContentUpdateFailureError(
  failure: ContentUpdateFailure,
  t: (key: string) => string
): AppError {
  if (!failure.reason) return failure.error;

  return { ...failure.error, serverMessage: t(REASON_MESSAGE_KEYS[failure.reason]) };
}
