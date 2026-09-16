import { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { createRuleGroup, formatToMongoDB, runMutation } from "@saltbox/saltbox-frontend-common";
import { toJS } from "mobx";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionList, RuleGroupType, RuleType } from "react-querybuilder";

import { fileDownloader } from "saltbox-core/features/file-download";

import { csvDownloader } from "../service/csv-downloader.service";

export const useCsvDownloader = ({
  slug,
  searchFilters,
  filterSchema,
  selectedMinions,
  onError,
}: {
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
  selectedMinions?: TaskTargetMinion[];
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
    setIsCSVLoading(true);

    const result = await runMutation({
      run: async () => {
        const hasSelectedMinions = Boolean(selectedMinions?.length);
        const filters = hasSelectedMinions
          ? createMinionIdsRuleGroup(selectedMinions as TaskTargetMinion[])
          : toJS(searchFilters);
        const fields = filterSchema ? toJS(filterSchema) : undefined;
        const query = hasSelectedMinions
          ? formatToMongoDB(filters, fields, { caseInsensitive: false })
          : formatToMongoDB(filters, fields);

        const response = await csvDownloader.createCsv("/minions/export", slug, query);
        const filename =
          "export_minions_" + new Date().toISOString().replace(/[-:]/g, "_").split(".")[0] + ".csv";
        await fileDownloader.downloadByResponse(response, filename);
      },
      errorMessage: t("minions.error-on-csv-download"),
    });

    setIsCSVLoading(false);
    if (!result.ok) onError?.();
  }, [createMinionIdsRuleGroup, filterSchema, onError, searchFilters, selectedMinions, slug, t]);

  return {
    isCSVLoading,
    handleCSVDownload,
  };
};
