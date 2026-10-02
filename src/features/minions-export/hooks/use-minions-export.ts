import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { formatToMongoDB, runMutation } from "@saltbox/saltbox-frontend-common";
import { toJS } from "mobx";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { createMinionIdsRuleGroup } from "../helpers/create-minion-ids-rule-group";
import { exportMinionsCsv } from "../helpers/export-minions-csv";

type MinionsExportByFilters = {
  mode: "filters";
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
};

type MinionsExportBySelected = {
  mode: "selected";
  slug: string;
  selectedMinions: TaskTargetMinion[];
  filterSchema?: OptionList;
};

export type UseMinionsExportOptions = MinionsExportByFilters | MinionsExportBySelected;

export function useMinionsExport(options: UseMinionsExportOptions) {
  const { slug, filterSchema } = options;
  const { t } = useTranslation();
  const { t: tCommon } = useTranslation("common");

  const handleExport = useCallback(async () => {
    if (options.mode === "selected" && options.selectedMinions.length === 0) {
      return false;
    }

    const result = await runMutation({
      run: async () => {
        const fields = filterSchema ? toJS(filterSchema) : undefined;
        const query =
          options.mode === "selected"
            ? formatToMongoDB(createMinionIdsRuleGroup(options.selectedMinions), fields, {
                caseInsensitive: false,
              })
            : formatToMongoDB(toJS(options.searchFilters), fields);

        await exportMinionsCsv(slug, query);
      },
      errorMessage: tCommon("export-to-csv.error", {
        subject: t("minions.export-subject"),
      }),
    });

    return result.ok;
  }, [filterSchema, options, slug, t, tCommon]);

  return { handleExport };
}
