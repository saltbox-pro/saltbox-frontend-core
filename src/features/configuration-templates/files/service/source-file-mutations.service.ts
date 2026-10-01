import { isApiNotFoundError } from "saltbox-core/shared/helpers/is-api-not-found-error";
import { apiCoreStore } from "saltbox-core/store";

import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { AddSourceFilePayload } from "../types/source-file-payload";

export async function uploadSourceFile(
  sourceId: string,
  payload: AddSourceFilePayload
): Promise<void> {
  const api = apiCoreStore.taskTemplateFilesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  await api.sshfsFileAdd({
    source_id: sourceId,
    file: payload.file,
    unpack_as: payload.unpack_as ?? undefined,
  });
}

export async function deleteSourceFileApi(
  sourceId: string,
  fileId: string
): Promise<ResourceDeleteResult> {
  const api = apiCoreStore.taskTemplateFilesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  try {
    await api.deleteSourceFile({
      source_id: sourceId,
      file_id: fileId,
    });
    return "deleted";
  } catch (error) {
    if (isApiNotFoundError(error)) {
      return "not_found";
    }
    throw error;
  }
}
