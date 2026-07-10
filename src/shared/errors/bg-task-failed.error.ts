import { formatBgTaskError } from "../helpers/format-bg-task-error";

export class BgTaskFailedError extends Error {
  constructor(error?: unknown, progressMeta?: string | null) {
    const message = formatBgTaskError(error, progressMeta);
    super(message || "BG_TASK_FAILED");
    this.name = "BgTaskFailedError";
  }
}

const isBgTaskFailedErrorLike = (error: Error): boolean =>
  error.name === "BgTaskFailedError" || error.message === "BG_TASK_FAILED";

export const isBgTaskFailedError = (error: unknown): error is BgTaskFailedError =>
  error instanceof BgTaskFailedError || (error instanceof Error && isBgTaskFailedErrorLike(error));
