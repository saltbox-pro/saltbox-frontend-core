import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { createRuleGroup, formatToMongoDB } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { RuleGroupType, RuleType } from "react-querybuilder";

import { fileDownloader } from "saltbox-core/features/file-download";

import { csvDownloader } from "../service/csv-downloader.service";

export const useCsvDownloader = ({
  slug,
  searchFilters,
  selectedMinions,
  messageApi,
  onError,
}: {
  slug: string;
  searchFilters: RuleGroupType;
  selectedMinions?: TaskTargetMinion[];
  messageApi?: MessageInstance;
  onError?: () => void;
}) => {
  const { t } = useTranslation();
  const [isCSVLoading, setIsCSVLoading] = useState(false);

  const createMinionIdsRuleGroup = useCallback(
    (selectedMinions: TaskTargetMinion[]): RuleGroupType => {
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
    },
    []
  );

  const handleCSVDownload = useCallback(async () => {
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
      if (onError) {
        onError();
      } else {
        messageApi?.error(t("minions.error-on-csv-download"));
      }
    } finally {
      setIsCSVLoading(false);
    }
  }, [createMinionIdsRuleGroup, messageApi, onError, searchFilters, selectedMinions, slug, t]);

  return {
    isCSVLoading,
    handleCSVDownload,
  };
};
