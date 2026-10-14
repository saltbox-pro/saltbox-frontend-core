import { ResponseError } from "@saltbox/saltbox-core-api-client";

import { fileDownloader } from "saltbox-core/features/file-download";
import { apiCoreStore } from "saltbox-core/store";

export async function exportTaskMinionsCsv(
  taskId: string,
  fallbackFilename: string
): Promise<void> {
  const response = await apiCoreStore.tasksApi?.tasksMinionsExportRaw({
    tid: taskId,
    TaskMinionExportBody: { query: {} },
  });

  if (!response) {
    throw new Error("API is unavailable");
  }

  if (!response.raw.ok) {
    throw new ResponseError(response.raw);
  }

  await fileDownloader.downloadByResponse(response.raw, fallbackFilename);
}
