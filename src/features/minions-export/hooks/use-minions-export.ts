import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { createRuleGroup, formatToMongoDB, runMutation } from "@saltbox/saltbox-frontend-common";
import { toJS } from "mobx";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList, RuleGroupType, RuleType } from "react-querybuilder";

import { fileDownloader } from "saltbox-core/features/file-download";

import { minionsCsvExporter } from "../service/minions-csv-exporter.service";

export function useMinionsExport({
  slug,
  searchFilters,
  filterSchema,
  selectedMinions,
}: {
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
  selectedMinions?: TaskTargetMinion[];
}) {
  const { t } = useTranslation();
  const { t: tCommon } = useTranslation("common");

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

  const handleExport = useCallback(async () => {
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

        const response = await minionsCsvExporter.createCsv(slug, query);
        const filename =
          "export_minions_" + new Date().toISOString().replace(/[-:]/g, "_").split(".")[0] + ".csv";
        await fileDownloader.downloadByResponse(response, filename);
      },
      errorMessage: tCommon("export-to-csv.error", {
        subject: t("minions.export-subject"),
      }),
    });

    return result.ok;
  }, [createMinionIdsRuleGroup, filterSchema, searchFilters, selectedMinions, slug, t, tCommon]);

  return { handleExport };
}
