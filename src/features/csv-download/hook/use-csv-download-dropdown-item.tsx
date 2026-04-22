import { ExportOutlined } from "@ant-design/icons";
import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import type { ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RuleGroupType } from "react-querybuilder";

import { useCsvDownloader } from "./use-csv-downloader";

export interface UseCsvDownloadDropdownItemOptions {
  slug: string;
  searchFilters: RuleGroupType;
  selectedMinions?: TaskTargetMinion[];
  messageApi?: MessageInstance;
}

export interface UseCsvDownloadDropdownItemResult {
  item: ActionDropdownItem;
}

export function useCsvDownloadDropdownItem({
  slug,
  searchFilters,
  selectedMinions,
  messageApi,
}: UseCsvDownloadDropdownItemOptions): UseCsvDownloadDropdownItemResult {
  const { t } = useTranslation();

  const exportAction = useCsvDownloader({
    slug,
    searchFilters,
    selectedMinions,
    messageApi,
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
