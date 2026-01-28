import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { createRuleGroup, formatToMongoDB } from "@saltbox/saltbox-frontend-common";
import { useState } from "react";
import { RuleGroupType, RuleType } from "react-querybuilder";

import { fileDownloader } from "saltbox-core/features/file-download";

import { csvDownloader } from "../service/csv-downloader.service";

export const useCsvDownloader = ({
  slug,
  searchFilters,
  selectedMinions,
  onError,
}: {
  slug: string;
  searchFilters: RuleGroupType;
  selectedMinions?: TaskTargetMinion[];
  onError: () => void;
}) => {
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const createMinionIdsRuleGroup = (selectedMinions: TaskTargetMinion[]): RuleGroupType => {
    const minionIds = selectedMinions
      .map((minion) => minion.minion_id)
      .filter(Boolean)
      .join(",");

    const rule: RuleType = {
      field: "minion_id",
      operator: "in",
      value: minionIds,
      valueSource: "value",
    };

    return createRuleGroup("and", [rule]);
  };

  const handleCSVDownload = async () => {
    try {
      setIsCSVLoading(true);

      const filters = selectedMinions?.length
        ? createMinionIdsRuleGroup(selectedMinions)
        : searchFilters;
      const query = formatToMongoDB(filters);

      const response = await csvDownloader.createCsv("/minions/export", slug, query);
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
