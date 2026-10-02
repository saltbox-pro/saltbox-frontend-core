import { DownloadOutlined } from "@ant-design/icons";
import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { useExportToCsvConfirm, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { useMinionsExport } from "./use-minions-export";

export interface UseMinionsExportDropdownItemOptions {
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
  selectedMinions?: TaskTargetMinion[];
}

export interface UseMinionsExportDropdownItemResult {
  item: ActionDropdownItem;
  modalContextHolder: ReactNode;
}

export function useMinionsExportDropdownItem({
  slug,
  searchFilters,
  filterSchema,
  selectedMinions,
}: UseMinionsExportDropdownItemOptions): UseMinionsExportDropdownItemResult {
  const { t } = useTranslation();
  const { t: tCommon } = useTranslation("common");
  const { handleExport } = useMinionsExport({
    slug,
    searchFilters,
    filterSchema,
    selectedMinions,
  });

  const scope = selectedMinions?.length
    ? t("minions.export-scope-selected")
    : t("minions.export-scope");

  const { isExporting, openConfirm, modalContextHolder } = useExportToCsvConfirm({
    scope,
    onExport: handleExport,
  });

  const item = useMemo<ActionDropdownItem>(
    () => ({
      key: "export",
      label: tCommon("export-to-csv.export"),
      icon: <DownloadOutlined />,
      disabled: isExporting,
      onClick: openConfirm,
    }),
    [isExporting, openConfirm, tCommon]
  );

  return { item, modalContextHolder };
}
