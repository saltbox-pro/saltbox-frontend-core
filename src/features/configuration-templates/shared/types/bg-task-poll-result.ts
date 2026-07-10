export type BgTaskPollFailedResult = {
  status: "failed";
  error?: unknown;
  progressMeta?: string | null;
};

export type BgTaskPollResult = "ok" | "aborted" | BgTaskPollFailedResult;

export function isBgTaskPollFailed(result: BgTaskPollResult): result is BgTaskPollFailedResult {
  return result !== null && typeof result === "object" && result.status === "failed";
}

export function createBgTaskPollFailedResult(
  error?: unknown,
  progressMeta?: string | null
): BgTaskPollFailedResult {
  return { status: "failed", error, progressMeta };
}
