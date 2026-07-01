import { extractTaskId } from "saltbox-core/shared/helpers/extract-task-id";
import { apiCoreStore } from "saltbox-core/store";

import { isApiNotFoundError } from "../../shared/helpers/is-api-not-found-error";
import type { ResourceDeleteResult } from "../../shared/types/resource-delete-result";
import type { AddSourceFilePayload } from "../types/source-file-payload";

export async function uploadSourceFile(
  sourceId: string,
  payload: AddSourceFilePayload
): Promise<string> {
  const api = apiCoreStore.taskTemplateFilesApi;
  if (!api) {
    throw new Error("API is not configured");
  }

  if (payload.file == null && payload.url?.trim()) {
    const response = await api.sshfsFileAddFromUrl({
      source_id: sourceId,
      rel_path: payload.rel_path,
      url: payload.url,
      unpack_as: payload.unpack_as ?? undefined,
    });

    return extractTaskId(response);
  }

  if (payload.file == null) {
    throw new Error("Either file or url must be provided");
  }

  await api.sshfsFileAdd({
    source_id: sourceId,
    rel_path: payload.rel_path,
    file: payload.file,
    unpack_as: payload.unpack_as ?? undefined,
  });

  return "";
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
