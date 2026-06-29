export class BgTaskFailedError extends Error {
  constructor(backendMessage?: unknown) {
    const message = typeof backendMessage === "string" ? backendMessage.trim() : "";
    super(message || "BG_TASK_FAILED");
    this.name = "BgTaskFailedError";
  }
}

const isBgTaskFailedErrorLike = (error: Error): boolean =>
  error.name === "BgTaskFailedError" || error.message === "BG_TASK_FAILED";

export const isBgTaskFailedError = (error: unknown): error is BgTaskFailedError =>
  error instanceof BgTaskFailedError || (error instanceof Error && isBgTaskFailedErrorLike(error));
