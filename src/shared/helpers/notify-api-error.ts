import { buildErrorDebugText, normalizeApiError, notify } from "@saltbox/saltbox-frontend-common";

export async function notifyApiError(error: unknown, title: string): Promise<void> {
  const appError = await normalizeApiError(error);

  notify.error({
    title,
    description: appError.serverMessage,
    errorCode: { status: appError.status, kind: appError.kind },
    debugText: appError.diagnostics ? buildErrorDebugText(appError) : undefined,
  });
}
