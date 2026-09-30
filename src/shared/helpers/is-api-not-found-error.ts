export function isApiNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ((error as { name?: string }).name !== "ResponseError") return false;

  const status = (error as { response?: Response }).response?.status;
  return status === 404;
}
