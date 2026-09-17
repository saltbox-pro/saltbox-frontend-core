import { ExportOutlined } from "@ant-design/icons";
import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import type { ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList, RuleGroupType } from "react-querybuilder";

import { useCsvDownloader } from "./use-csv-downloader";

export interface UseCsvDownloadDropdownItemOptions {
  slug: string;
  searchFilters: RuleGroupType;
  filterSchema?: OptionList;
  selectedMinions?: TaskTargetMinion[];
}

export interface UseCsvDownloadDropdownItemResult {
  item: ActionDropdownItem;
}

export function useCsvDownloadDropdownItem({
  slug,
  searchFilters,
  filterSchema,
  selectedMinions,
}: UseCsvDownloadDropdownItemOptions): UseCsvDownloadDropdownItemResult {
  const { t } = useTranslation();

  const exportAction = useCsvDownloader({
    slug,
    searchFilters,
    filterSchema,
    selectedMinions,
  });

  const item = useMemo<ActionDropdownItem>(() => {
    return {
      key: "export",
      label: t("minions.export"),
      icon: <ExportOutlined />,
      disabled: exportAction.isCSVLoading,
      onClick: exportAction.handleCSVDownload,
    };
  }, [exportAction.handleCSVDownload, exportAction.isCSVLoading, t]);

  return { item };
}
