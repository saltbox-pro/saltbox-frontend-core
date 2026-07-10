import { getSyncErrorDetail } from "./sync-error-detail";

export async function getSourceCreateErrorMessage(
  reason: unknown,
  fallback: string
): Promise<string> {
  return (await getSyncErrorDetail(reason)) ?? fallback;
}
