import { apiCoreStore } from "saltbox-core/store";

import { isApiNotFoundError } from "../../shared/helpers/is-api-not-found-error";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { AddSourceFilePayload } from "../types/source-file-payload";

export async function uploadSourceFile(
  sourceId: string,
  payload: AddSourceFilePayload
): Promise<void> {
  const api = apiCoreStore.templateSourceFilesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  await api.sshfsFileAdd({
    source_id: sourceId,
    rel_path: payload.rel_path,
    file: payload.file ?? undefined,
    url: payload.url ?? undefined,
    unpack_as: payload.unpack_as ?? undefined,
  });
}

export async function deleteSourceFileApi(
  sourceId: string,
  fileId: string
): Promise<ResourceDeleteResult> {
  const api = apiCoreStore.templateSourceFilesApi;
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
