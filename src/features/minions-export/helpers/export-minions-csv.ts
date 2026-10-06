import { buildCsvExportFilename } from "@saltbox/saltbox-frontend-common";

import { fileDownloader } from "saltbox-core/features/file-download";

import { minionsCsvExporter } from "../service/minions-csv-exporter.service";

export async function exportMinionsCsv(slug: string, query: object) {
  const response = await minionsCsvExporter.createCsv(slug, query);
  await fileDownloader.downloadByResponse(response, buildCsvExportFilename("export_minions"));
}
