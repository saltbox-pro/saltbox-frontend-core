import { DownloadOutlined } from "@ant-design/icons";
import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { useExportToCsvConfirm, type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList } from "react-querybuilder";

import { useMinionsExport } from "../hooks/use-minions-export";

type ExportContributionParts = {
  item: ActionDropdownItem | null;
  modalContextHolder: ReactNode;
};

type MinionsExportDropdownContributionProps = {
  enabled: boolean;
  slug: string;
  filterSchema?: OptionList;
  selectedMinions: TaskTargetMinion[];
  children: (parts: ExportContributionParts) => ReactNode;
};

export function MinionsExportDropdownContribution({
  enabled,
  slug,
  filterSchema,
  selectedMinions,
  children,
}: MinionsExportDropdownContributionProps) {
  if (!enabled) {
    return <>{children({ item: null, modalContextHolder: null })}</>;
  }

  return (
    <MinionsExportDropdownContributionActive
      slug={slug}
      filterSchema={filterSchema}
      selectedMinions={selectedMinions}
    >
      {children}
    </MinionsExportDropdownContributionActive>
  );
}

function MinionsExportDropdownContributionActive({
  slug,
  filterSchema,
  selectedMinions,
  children,
}: {
  slug: string;
  filterSchema?: OptionList;
  selectedMinions: TaskTargetMinion[];
  children: (parts: ExportContributionParts) => ReactNode;
}) {
  const { t } = useTranslation();
  const { t: tCommon } = useTranslation("common");

  const { handleExport } = useMinionsExport({
    mode: "selected",
    slug,
    filterSchema,
    selectedMinions,
  });

  const { isExporting, openConfirm, modalContextHolder } = useExportToCsvConfirm({
    scope: t("minions.export-scope-selected"),
    onExport: handleExport,
  });

  const item = useMemo<ActionDropdownItem>(
    () => ({
      key: "export",
      label: tCommon("export-to-csv.title"),
      icon: <DownloadOutlined />,
      disabled: isExporting,
      onClick: openConfirm,
    }),
    [isExporting, openConfirm, tCommon]
  );

  return <>{children({ item, modalContextHolder })}</>;
}
