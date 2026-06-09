export class BgTaskPollAbortedError extends Error {
  constructor(cause?: unknown) {
    super("BG_TASK_POLL_ABORTED", { cause });
    this.name = "BgTaskPollAbortedError";
  }

  static fromSignal(signal: AbortSignal): BgTaskPollAbortedError {
    return new BgTaskPollAbortedError(signal.reason);
  }
}

export const isFetchAbortError = (error: unknown): boolean =>
  (error instanceof DOMException || error instanceof Error) && error.name === "AbortError";

export const isBgTaskPollAborted = (error: unknown): boolean =>
  error instanceof BgTaskPollAbortedError || isFetchAbortError(error);

export const rethrowIfAborted = (error: unknown, signal?: AbortSignal): void => {
  if (!signal?.aborted && !isFetchAbortError(error)) return;

  throw signal ? BgTaskPollAbortedError.fromSignal(signal) : new BgTaskPollAbortedError(error);
};
