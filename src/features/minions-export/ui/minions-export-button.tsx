import { ExportToCsv } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { useMinionsExport } from "../hooks/use-minions-export";

export type MinionsExportButtonProps = {
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
};

export function MinionsExportButton({
  slug,
  searchFilters,
  filterSchema,
}: MinionsExportButtonProps) {
  const { t } = useTranslation();
  const { handleExport } = useMinionsExport({
    mode: "filters",
    slug,
    searchFilters,
    filterSchema,
  });

  return <ExportToCsv scope={t("minions.export-scope")} onExport={handleExport} />;
}
