import { formatBgTaskError } from "../helpers/format-bg-task-error";

const getBgTaskExcType = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const excType = (error as { exc_type?: unknown }).exc_type;
  return typeof excType === "string" && excType ? excType : undefined;
};

export class BgTaskFailedError extends Error {
  readonly excType?: string;

  constructor(error?: unknown, progressMeta?: string | null) {
    const message = formatBgTaskError(error, progressMeta);
    super(message || "BG_TASK_FAILED");
    this.name = "BgTaskFailedError";
    this.excType = getBgTaskExcType(error);
  }
}

const isBgTaskFailedErrorLike = (error: Error): boolean =>
  error.name === "BgTaskFailedError" || error.message === "BG_TASK_FAILED";

export const isBgTaskFailedError = (error: unknown): error is BgTaskFailedError =>
  error instanceof BgTaskFailedError || (error instanceof Error && isBgTaskFailedErrorLike(error));
