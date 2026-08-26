export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const err = error as { name?: string; cause?: { name?: string; code?: unknown } };
  return (
    err.name === "AbortError" ||
    err.cause?.name === "AbortError" ||
    err.cause?.code === DOMException.ABORT_ERR
  );
}
