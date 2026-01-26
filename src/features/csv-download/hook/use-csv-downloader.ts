import { useState } from "react";

import { fileDownloader } from "saltbox-core/features/file-download";

import { csvDownloader } from "../service/csv-downloader.service";

export const useCsvDownloader = ({
  slug,
  searchMongoDBQuery,
  onError,
}: {
  slug: string;
  searchMongoDBQuery: object;
  onError: () => void;
}) => {
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const handleCSVDownload = async () => {
    try {
      setIsCSVLoading(true);
      const response = await csvDownloader.createCsv("/minions/export", slug, searchMongoDBQuery);
      const filename =
        "export_minions_" + new Date().toISOString().replace(/[-:]/g, "_").split(".")[0] + ".csv";
      await fileDownloader.downloadByResponse(response, filename);
    } catch (error) {
      console.error("CSV download failed:", error);
      onError();
    } finally {
      setIsCSVLoading(false);
    }
  };

  return {
    isCSVLoading,
    handleCSVDownload,
  };
};
