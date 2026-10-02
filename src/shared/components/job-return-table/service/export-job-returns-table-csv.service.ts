import { ResponseError } from "@saltbox/saltbox-core-api-client";

import { fileDownloader } from "saltbox-core/features/file-download";
import { apiCoreStore } from "saltbox-core/store";

export async function exportJobReturnsTableCsv(
  query: Record<string, unknown>,
  fallbackFilename: string
): Promise<void> {
  const response = await apiCoreStore.jobsApi?.jobReturnsCsvRaw({
    JobReturnsDataCSVBody: { query },
  });

  if (!response) {
    throw new Error("API is unavailable");
  }

  if (!response.raw.ok) {
    throw new ResponseError(response.raw);
  }

  await fileDownloader.downloadByResponse(response.raw, fallbackFilename);
}
