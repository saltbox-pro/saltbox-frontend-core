import { getSyncErrorDetail } from "./sync-error-detail";

export async function getSourceFormErrorMessage(
  reason: unknown,
  fallback: string
): Promise<string> {
  return (await getSyncErrorDetail(reason)) ?? fallback;
}
